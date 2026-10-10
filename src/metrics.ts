export type Variant = 'baseline' | 'leantoken';

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

const fmt = (n: number, digits = 0) => (Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: digits }) : '–');
const pct = (n: number) => (Number.isFinite(n) ? `${n > 0 ? '+' : ''}${n.toFixed(0)}%` : '–');

export function formatReport(records: RunRecord[]): string {
  const tasks = [...new Set(records.map((r) => r.task))].sort();
  const pick = (task: string | null, v: Variant) => records.filter((r) => r.variant === v && (task === null || r.task === task));
  const lines: string[] = ['LeanToken Benchmark', '─'.repeat(64)];
  const rate = (n: number) => (Number.isFinite(n) ? `${(n * 100).toFixed(0)}%` : '–');

  const section = (title: string, b: Stats, l: Stats) => {
    lines.push(`${title}  (runs: ${b.runs} baseline / ${l.runs} leantoken)`);
    const rows = [
      ['', 'Baseline', 'LeanToken', 'Change'],
      ['Lines changed', fmt(b.lines), fmt(l.lines), pct(change(b.lines, l.lines))],
      ['Output tokens', fmt(b.outputTokens), fmt(l.outputTokens), pct(change(b.outputTokens, l.outputTokens))],
      ['Cost (USD)', fmt(b.costUsd, 4), fmt(l.costUsd, 4), pct(change(b.costUsd, l.costUsd))],
      ['Time (s)', fmt(b.seconds, 1), fmt(l.seconds, 1), pct(change(b.seconds, l.seconds))],
      ['Tests all pass', rate(b.passRate), rate(l.passRate), ''],
      ['New deps (total)', fmt(b.newDeps), fmt(l.newDeps), ''],
    ];
    for (const [a, b2, c, d] of rows) lines.push(`  ${a.padEnd(18)}${b2.padStart(11)}${c.padStart(12)}${d.padStart(10)}`);
    lines.push('');
  };

  for (const t of tasks) section(`Task: ${t}`, stats(pick(t, 'baseline')), stats(pick(t, 'leantoken')));
  if (tasks.length > 1) section('All tasks (medians)', stats(pick(null, 'baseline')), stats(pick(null, 'leantoken')));

  const rungs = pick(null, 'leantoken').map((r) => r.rung);
  if (rungs.length) {
    const counts = new Map<string, number>();
    for (const r of rungs) counts.set(r === null ? 'none' : String(r), (counts.get(r === null ? 'none' : String(r)) ?? 0) + 1);
    lines.push(`Decision rungs (leantoken): ${[...counts].sort().map(([k, v]) => `${k}=${v}`).join('  ')}`);
  }
  lines.push('Medians exclude errored runs. Pass rate counts errored runs as failures.');
  return lines.join('\n');
}
