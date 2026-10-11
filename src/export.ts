import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { loadTasks } from './bench.js';
import { median, medianTaskChange, type RunRecord, type Variant } from './metrics.js';

const passed = (r: RunRecord) => !r.error && r.testsTotal > 0 && r.testsPassed === r.testsTotal;
const lines = (r: RunRecord) => r.linesAdded + r.linesRemoved;

/** The run closest to the median size, preferring runs whose tests passed, so the page shows a typical result. */
function typical(runs: RunRecord[]): RunRecord | undefined {
  const pool = runs.filter(passed).length ? runs.filter(passed) : runs.filter((r) => !r.error);
  const m = median(pool.map(lines));
  return [...pool].sort((a, b) => Math.abs(lines(a) - m) - Math.abs(lines(b) - m))[0];
}

function side(runs: RunRecord[]) {
  const ok = runs.filter((r) => !r.error);
  const t = typical(runs);
  return {
    runs: runs.length,
    passRate: runs.length ? runs.filter(passed).length / runs.length : 0,
    lines: median(ok.map(lines)),
    outputTokens: median(ok.map((r) => r.outputTokens)),
    costUsd: median(ok.map((r) => r.costUsd)),
    seconds: median(ok.map((r) => r.durationMs / 1000)),
    newDependencies: [...new Set(ok.flatMap((r) => r.newDependencies))],
    rung: t?.rung ?? null,
    patch: t?.patch ?? '',
  };
}

/** Write a compact results file for the project page. */
export function exportSite(records: RunRecord[], file: string) {
  const prompts = new Map(loadTasks().map((t) => [t.id, t.prompt]));
  const ids = [...new Set(records.map((r) => r.task))].sort();
  const of = (task: string, v: Variant) => records.filter((r) => r.task === task && r.variant === v);
  const all = (v: Variant) => records.filter((r) => r.variant === v);
  const rate = (v: Variant) => all(v).filter(passed).length / Math.max(1, all(v).length);
  const variants = [...new Set(records.map((r) => r.variant))].filter((v) => v !== 'baseline').sort();

  const data = {
    generatedAt: new Date().toISOString(),
    models: [...new Set(records.map((r) => r.model))],
    summary: {
      tasks: ids.length,
      runs: records.length,
      variants: variants.map((v) => ({
        variant: v,
        lines: medianTaskChange(records, 'baseline', v, 'lines'),
        outputTokens: medianTaskChange(records, 'baseline', v, 'outputTokens'),
        costUsd: medianTaskChange(records, 'baseline', v, 'costUsd'),
        seconds: medianTaskChange(records, 'baseline', v, 'seconds'),
        passRate: rate(v),
      })),
      baselinePassRate: rate('baseline'),
    },
    tasks: ids.map((id) => ({ id, prompt: prompts.get(id) ?? '', baseline: side(of(id, 'baseline')), leantoken: side(of(id, 'leantoken')) })),
  };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  return { tasks: ids.length, runs: records.length };
}
