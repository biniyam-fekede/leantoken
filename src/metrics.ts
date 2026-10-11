/** 'baseline', 'leantoken', or an ablation like 'no-step-3'. */
export type Variant = string;

export interface RunRecord {
  task: string;
  variant: Variant;
  model: string;
  rulesVersion: string;
  timestamp: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  linesAdded: number;
  linesRemoved: number;
  newDependencies: string[];
  testsPassed: number;
  testsTotal: number;
  rung: number | null;
  patch?: string;
  error?: string;
}

/** Sum `git diff --numstat` output, ignoring lockfiles and binary entries. */
export function parseNumstat(out: string): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const line of out.split('\n')) {
    const [a, r, file] = line.split('\t');
    if (!file || a === '-' || /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(file)) continue;
    added += Number(a);
    removed += Number(r);
  }
  return { added, removed };
}

type Manifest = { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };

export function newDependencies(before: Manifest, after: Manifest): string[] {
  const had = new Set([...Object.keys(before.dependencies ?? {}), ...Object.keys(before.devDependencies ?? {})]);
  return [...Object.keys(after.dependencies ?? {}), ...Object.keys(after.devDependencies ?? {})].filter((d) => !had.has(d));
}

/** Read pass/fail totals from `node --test` TAP output. */
export function parseNodeTest(out: string): { passed: number; total: number } {
  const passed = Number(out.match(/^# pass (\d+)/m)?.[1] ?? 0);
  const failed = Number(out.match(/^# fail (\d+)/m)?.[1] ?? 0);
  return { passed, total: passed + failed };
}

export function parseRung(text: string): number | null {
  const m = text.match(/LeanToken:\s*rung=([1-7])/);
  return m ? Number(m[1]) : null;
}

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

interface Stats {
  runs: number;
  lines: number;
  outputTokens: number;
  costUsd: number;
  seconds: number;
  passRate: number;
  newDeps: number;
}

function stats(runs: RunRecord[]): Stats {
  const ok = runs.filter((r) => !r.error);
  return {
    runs: runs.length,
    lines: median(ok.map((r) => r.linesAdded + r.linesRemoved)),
    outputTokens: median(ok.map((r) => r.outputTokens)),
    costUsd: median(ok.map((r) => r.costUsd)),
    seconds: median(ok.map((r) => r.durationMs / 1000)),
    passRate: runs.length ? runs.filter((r) => !r.error && r.testsTotal > 0 && r.testsPassed === r.testsTotal).length / runs.length : NaN,
    newDeps: ok.reduce((n, r) => n + r.newDependencies.length, 0),
  };
}

/** Percent change from baseline to leantoken (negative = reduction). */
export function change(base: number, lean: number): number {
  return base === 0 ? (lean === 0 ? 0 : Infinity) : ((lean - base) / base) * 100;
}

type Metric = 'lines' | 'outputTokens' | 'costUsd' | 'seconds';

/**
 * Median over tasks of each task's percent change from variant `a` to `b`.
 * Tasks differ wildly in size, so this is a fairer headline than a pooled median.
 */
export function medianTaskChange(records: RunRecord[], a: Variant, b: Variant, metric: Metric): number {
  const tasks = [...new Set(records.map((r) => r.task))];
  const of = (t: string, v: Variant) => stats(records.filter((r) => r.task === t && r.variant === v))[metric];
  return median(tasks.map((t) => change(of(t, a), of(t, b))).filter(Number.isFinite));
}

const fmt = (n: number, digits = 0) => (Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: digits }) : '–');
const pct = (n: number) => (Number.isFinite(n) ? `${n > 0 ? '+' : ''}${n.toFixed(0)}%` : '–');

export function formatReport(records: RunRecord[]): string {
  const tasks = [...new Set(records.map((r) => r.task))].sort();
  const pick = (task: string | null, v: Variant) => records.filter((r) => r.variant === v && (task === null || r.task === task));
  const lines: string[] = ['LeanToken Benchmark', '─'.repeat(64)];
  const rate = (n: number) => (Number.isFinite(n) ? `${(n * 100).toFixed(0)}%` : '–');

  const section = (title: string, b: Stats, l: Stats, delta = (m: Metric) => change(b[m], l[m])) => {
    lines.push(`${title}  (runs: ${b.runs} baseline / ${l.runs} leantoken)`);
    const rows = [
      ['', 'Baseline', 'LeanToken', 'Change'],
      ['Lines changed', fmt(b.lines), fmt(l.lines), pct(delta('lines'))],
      ['Output tokens', fmt(b.outputTokens), fmt(l.outputTokens), pct(delta('outputTokens'))],
      ['Cost (USD)', fmt(b.costUsd, 4), fmt(l.costUsd, 4), pct(delta('costUsd'))],
      ['Time (s)', fmt(b.seconds, 1), fmt(l.seconds, 1), pct(delta('seconds'))],
      ['Tests all pass', rate(b.passRate), rate(l.passRate), ''],
      ['New deps (total)', fmt(b.newDeps), fmt(l.newDeps), ''],
    ];
    for (const [a, b2, c, d] of rows) lines.push(`  ${a.padEnd(18)}${b2.padStart(11)}${c.padStart(12)}${d.padStart(10)}`);
    lines.push('');
  };

  for (const t of tasks) section(`Task: ${t}`, stats(pick(t, 'baseline')), stats(pick(t, 'leantoken')));
  if (tasks.length > 1) {
    section('All tasks (pooled medians; Change = median of per-task changes)', stats(pick(null, 'baseline')), stats(pick(null, 'leantoken')),
      (m) => medianTaskChange(records, 'baseline', 'leantoken', m));
  }

  const variants = [...new Set(records.map((r) => r.variant))].filter((v) => v !== 'baseline').sort();
  if (variants.length > 1) {
    lines.push('Variants vs baseline (median of per-task changes)');
    lines.push(`  ${'Variant'.padEnd(14)}${'Lines'.padStart(9)}${'Out tok'.padStart(10)}${'Cost'.padStart(9)}${'Time'.padStart(9)}${'All pass'.padStart(10)}`);
    for (const v of variants) {
      const c = (m: Metric) => pct(medianTaskChange(records, 'baseline', v, m));
      lines.push(`  ${v.padEnd(14)}${c('lines').padStart(9)}${c('outputTokens').padStart(10)}${c('costUsd').padStart(9)}${c('seconds').padStart(9)}${rate(stats(pick(null, v)).passRate).padStart(10)}`);
    }
    lines.push('');
  }

  const rungs = pick(null, 'leantoken').map((r) => r.rung);
  if (rungs.length) {
    const counts = new Map<string, number>();
    for (const r of rungs) counts.set(r === null ? 'none' : String(r), (counts.get(r === null ? 'none' : String(r)) ?? 0) + 1);
    lines.push(`Decision rungs (leantoken): ${[...counts].sort().map(([k, v]) => `${k}=${v}`).join('  ')}`);
  }
  lines.push('Medians exclude errored runs. Pass rate counts errored runs as failures.');
  return lines.join('\n');
}
