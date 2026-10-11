import { execFile } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { newDependencies, parseNodeTest, parseNumstat, parseRung, type RunRecord, type Variant } from './metrics.js';
import { LITE_RULES_PATH, rulesText, rulesVersion, rulesWithout } from './rules.js';

export const DEFAULT_TASKS_DIR = fileURLToPath(new URL('../benchmark-tasks', import.meta.url));

export interface Task {
  id: string;
  dir: string;
  prompt: string;
}

export interface BenchOptions {
  model: string;
  timeoutMs: number;
  keep: boolean;
}

function run(cmd: string, args: string[], cwd: string, timeout = 120_000): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd, timeout, maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ code: err ? (typeof err.code === 'number' ? err.code : 1) : 0, stdout, stderr });
    });
  });
}

export function loadTasks(dir = DEFAULT_TASKS_DIR, only?: string[]): Task[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, 'task.json')))
    .filter((e) => !only?.length || only.includes(e.name))
    .map((e) => {
      const taskDir = join(dir, e.name);
      const { prompt } = JSON.parse(readFileSync(join(taskDir, 'task.json'), 'utf8')) as { prompt: string };
      return { id: e.name, dir: taskDir, prompt };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

const readManifest = (dir: string) => {
  const p = join(dir, 'package.json');
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
};

/** The system-prompt addition for a variant, or null for the baseline. */
export function rulesFor(variant: Variant): string | null {
  if (variant === 'baseline') return null;
  if (variant === 'leantoken') return rulesText();
  if (variant === 'lite') return readFileSync(LITE_RULES_PATH, 'utf8');
  const step = variant.match(/^no-step-([1-7])$/)?.[1];
  if (step) return rulesWithout(Number(step));
  throw new Error(`Unknown variant "${variant}". Use baseline, leantoken, lite, or no-step-1 … no-step-7.`);
}

/** Run one task once under one variant in a throwaway git checkout. */
export async function runTask(task: Task, variant: Variant, opts: BenchOptions): Promise<RunRecord> {
  const rules = rulesFor(variant);
  const work = mkdtempSync(join(tmpdir(), `leantoken-${task.id}-`));
  const record: RunRecord = {
    task: task.id, variant, model: opts.model, rulesVersion: rules ? rulesVersion(rules) : 'none',
    timestamp: new Date().toISOString(), durationMs: 0, inputTokens: 0, outputTokens: 0, costUsd: 0,
    linesAdded: 0, linesRemoved: 0, newDependencies: [], testsPassed: 0, testsTotal: 0, rung: null,
  };

  try {
    cpSync(join(task.dir, 'repo'), work, { recursive: true });
    const before = readManifest(work);
    await run('git', ['init', '-q'], work);
    writeFileSync(join(work, '.git', 'info', 'exclude'), 'node_modules/\n');
    await run('git', ['add', '-A'], work);
    await run('git', ['-c', 'user.name=leantoken', '-c', 'user.email=leantoken@localhost', 'commit', '-qm', 'start'], work);

    // The agent sees only the repo; the hidden tests are copied in afterwards so they can't be edited or gamed.
    const args = ['-p', task.prompt, '--output-format', 'json', '--model', opts.model, '--dangerously-skip-permissions'];
    if (rules) args.push('--append-system-prompt', rules);
    const started = Date.now();
    const agent = await run('claude', args, work, opts.timeoutMs);
    record.durationMs = Date.now() - started;

    const out = JSON.parse(agent.stdout || '{}');
    if (agent.code !== 0 || out.is_error) record.error = (out.result || agent.stderr || `claude exited ${agent.code}`).slice(0, 500);
    const u = out.usage ?? {};
    record.inputTokens = (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
    record.outputTokens = u.output_tokens ?? 0;
    record.costUsd = out.total_cost_usd ?? 0;
    record.rung = parseRung(out.result ?? '');

    await run('git', ['add', '-A'], work);
    const { added, removed } = parseNumstat((await run('git', ['diff', '--cached', '--numstat', 'HEAD'], work)).stdout);
    record.linesAdded = added;
    record.linesRemoved = removed;
    record.newDependencies = newDependencies(before, readManifest(work));
    record.patch = (await run('git', ['diff', '--cached', 'HEAD', '--', '.', ':!package-lock.json'], work)).stdout.slice(0, 20_000);

    const testDir = join(work, '.leantoken-tests');
    mkdirSync(testDir);
    cpSync(join(task.dir, 'test'), testDir, { recursive: true });
    const files = readdirSync(testDir).filter((f) => f.endsWith('.test.js')).map((f) => join('.leantoken-tests', f));
    const tests = await run(process.execPath, ['--test', '--test-reporter=tap', ...files], work);
    const { passed, total } = parseNodeTest(tests.stdout);
    record.testsPassed = passed;
    record.testsTotal = total;
  } catch (err) {
    record.error = String(err).slice(0, 500);
  } finally {
    if (!opts.keep) rmSync(work, { recursive: true, force: true });
  }
  return record;
}

/** True when a run failed because the account hit a usage or rate limit, not because of the agent. */
export function isLimitError(r: RunRecord): boolean {
  return !!r.error && /session limit|usage limit|rate limit|hit your limit|overloaded/i.test(r.error);
}

export function appendRecord(file: string, record: RunRecord): void {
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, JSON.stringify(record) + '\n');
}

export function readRecords(file: string): RunRecord[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}
