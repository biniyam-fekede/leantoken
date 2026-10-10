#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { appendRecord, DEFAULT_TASKS_DIR, loadTasks, readRecords, runTask } from './bench.js';
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
  --keep               Keep the temp checkouts for inspection`;

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
    // Interleave variants within each repetition so drift (rate limits, model updates) hits both equally.
    for (const task of tasks) {
      for (let i = 1; i <= runs; i++) {
        for (const variant of variants) {
          process.stdout.write(`${task.id} [${variant}] run ${i}/${runs} ... `);
          const r = await runTask(task, variant, opts);
          appendRecord(values.out, r);
          console.log(r.error ? `error: ${r.error.split('\n')[0]}` : `${r.testsPassed}/${r.testsTotal} tests, ${r.linesAdded + r.linesRemoved} lines, ${(r.durationMs / 1000).toFixed(1)}s`);
        }
      }
    }
    console.log(`\n${formatReport(readRecords(values.out))}`);
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
