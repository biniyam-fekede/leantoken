#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { appendRecord, DEFAULT_TASKS_DIR, loadTasks, readRecords, rulesFor, runTask } from './bench.js';
import { exportSite } from './export.js';
import { formatReport, type Variant } from './metrics.js';
import { install, rulesText, rulesVersion, uninstall } from './rules.js';

const HELP = `leantoken: nudge coding agents toward the simplest complete implementation, and measure it.

Usage:
  leantoken install   [--file CLAUDE.md]   Add the LeanToken rules to a project instruction file
  leantoken uninstall [--file CLAUDE.md]   Remove them again
  leantoken rules                          Print the current ruleset
  leantoken tasks     [--tasks-dir DIR]    List benchmark tasks
  leantoken bench     [options]            Run paired baseline vs leantoken benchmarks
  leantoken report    [--out FILE]         Summarize recorded runs

Bench options:
  --tasks a,b          Only run these task ids (default: all)
  --runs N             Repetitions per task and variant (default: 3)
  --model NAME         Model passed to claude (default: sonnet)
  --variants a,b       Variants to run (default: baseline,leantoken)
  --timeout SECONDS    Per-run agent timeout (default: 600)
  --out FILE           JSONL results file (default: results/runs.jsonl)
  --tasks-dir DIR      Task directory (default: bundled benchmark-tasks)
  --concurrency N      Runs in parallel (default: 1)
  --keep               Keep the temp checkouts for inspection

Variants: baseline, leantoken, or no-step-1 … no-step-7 (the ruleset with that checklist step removed).

  leantoken export    [--out FILE] [--site docs/results.json]   Write results for the project page`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    file: { type: 'string', default: 'CLAUDE.md' },
    tasks: { type: 'string' },
    'tasks-dir': { type: 'string', default: DEFAULT_TASKS_DIR },
    runs: { type: 'string', default: '3' },
    model: { type: 'string', default: 'sonnet' },
    variants: { type: 'string', default: 'baseline,leantoken' },
    timeout: { type: 'string', default: '600' },
    out: { type: 'string', default: 'results/runs.jsonl' },
    keep: { type: 'boolean', default: false },
    concurrency: { type: 'string', default: '1' },
    site: { type: 'string', default: 'docs/results.json' },
    help: { type: 'boolean', short: 'h' },
  },
});

const list = (s?: string) => s?.split(',').map((x) => x.trim()).filter(Boolean);

switch (values.help ? 'help' : positionals[0]) {
  case 'install':
    install(values.file);
    console.log(`LeanToken rules v${rulesVersion()} added to ${values.file}. Undo with: leantoken uninstall`);
    break;
  case 'uninstall':
    console.log(uninstall(values.file) ? `Removed LeanToken rules from ${values.file}.` : `No LeanToken rules found in ${values.file}.`);
    break;
  case 'rules':
    process.stdout.write(rulesText());
    break;
  case 'tasks':
    for (const t of loadTasks(values['tasks-dir'])) console.log(`${t.id.padEnd(20)} ${t.prompt.split('\n')[0]}`);
    break;
  case 'bench': {
    const tasks = loadTasks(values['tasks-dir'], list(values.tasks));
    const variants = list(values.variants) as Variant[];
    const runs = Number(values.runs);
    if (!tasks.length) throw new Error('No matching tasks.');
    const opts = { model: values.model, timeoutMs: Number(values.timeout) * 1000, keep: values.keep };
    variants.forEach(rulesFor); // fail fast on a typo before spending any runs
    // Interleave variants within each repetition so drift (rate limits, model updates) hits all of them equally.
    const jobs = tasks.flatMap((task) => Array.from({ length: runs }, (_, i) => variants.map((variant) => ({ task, variant, i: i + 1 }))).flat());
    let next = 0;
    let done = 0;
    const worker = async () => {
      while (next < jobs.length) {
        const { task, variant, i } = jobs[next++];
        const r = await runTask(task, variant, opts);
        appendRecord(values.out, r);
        const result = r.error ? `error: ${r.error.split('\n')[0]}` : `${r.testsPassed}/${r.testsTotal} tests, ${r.linesAdded + r.linesRemoved} lines, ${(r.durationMs / 1000).toFixed(1)}s`;
        console.log(`[${++done}/${jobs.length}] ${task.id} [${variant}] run ${i}: ${result}`);
      }
    };
    await Promise.all(Array.from({ length: Math.max(1, Number(values.concurrency)) }, worker));
    console.log(`\n${formatReport(readRecords(values.out))}`);
    break;
  }
  case 'export': {
    const summary = exportSite(readRecords(values.out), values.site);
    console.log(`Wrote ${summary.tasks} tasks from ${summary.runs} runs to ${values.site}.`);
    break;
  }
  case 'report': {
    const records = readRecords(values.out);
    console.log(records.length ? formatReport(records) : `No runs recorded in ${values.out}. Run: leantoken bench`);
    break;
  }
  default:
    console.log(HELP);
}
