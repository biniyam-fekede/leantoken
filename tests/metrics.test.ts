import { describe, expect, it } from 'vitest';
import { change, formatReport, median, medianTaskChange, newDependencies, parseNodeTest, parseNumstat, parseRung, type RunRecord } from '../src/metrics.js';

describe('parseNumstat', () => {
  it('sums lines and skips lockfiles and binaries', () => {
    const out = '10\t2\tsrc/a.js\n3\t0\tsrc/b.js\n500\t20\tpackage-lock.json\n-\t-\timg.png\n';
    expect(parseNumstat(out)).toEqual({ added: 13, removed: 2 });
  });
  it('handles empty diff', () => expect(parseNumstat('')).toEqual({ added: 0, removed: 0 }));
});

describe('newDependencies', () => {
  it('lists only added packages', () => {
    expect(newDependencies({ dependencies: { a: '1' } }, { dependencies: { a: '1', b: '2' }, devDependencies: { c: '3' } })).toEqual(['b', 'c']);
  });
  it('treats moving between dep groups as not new', () => {
    expect(newDependencies({ devDependencies: { a: '1' } }, { dependencies: { a: '1' } })).toEqual([]);
  });
});

describe('parsers', () => {
  it('reads node --test TAP totals', () => {
    expect(parseNodeTest('# tests 3\n# pass 2\n# fail 1\n')).toEqual({ passed: 2, total: 3 });
    expect(parseNodeTest('# pass 0\n# fail 0\n# cancelled 2\n')).toEqual({ passed: 0, total: 2 });
  });
  it('reads the decision rung', () => {
    expect(parseRung('Done.\nLeanToken: rung=3 used Intl.DateTimeFormat')).toBe(3);
    expect(parseRung('no record')).toBeNull();
  });
});

describe('median and change', () => {
  it('computes medians', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNaN();
  });
  it('computes percent change', () => {
    expect(change(200, 150)).toBe(-25);
    expect(change(0, 0)).toBe(0);
  });
});

describe('formatReport', () => {
  const rec = (variant: RunRecord['variant'], lines: number, extra: Partial<RunRecord> = {}): RunRecord => ({
    task: 't', variant, model: 'm', rulesVersion: '1', timestamp: '', durationMs: 10_000, inputTokens: 0, outputTokens: 100,
    costUsd: 0.01, linesAdded: lines, linesRemoved: 0, newDependencies: [], testsPassed: 2, testsTotal: 2, rung: null, ...extra,
  });

  it('compares variants and reports rungs', () => {
    const report = formatReport([rec('baseline', 40), rec('leantoken', 10, { rung: 3 })]);
    expect(report).toMatch(/Lines changed\s+40\s+10\s+-75%/);
    expect(report).toMatch(/Tests all pass\s+100%\s+100%/);
    expect(report).toContain('Decision rungs (leantoken): 3=1');
  });

  it('counts errored runs as failures and excludes them from medians', () => {
    const report = formatReport([rec('baseline', 40), rec('baseline', 999, { error: 'boom' }), rec('leantoken', 10)]);
    expect(report).toMatch(/Lines changed\s+40\s/);
    expect(report).toMatch(/Tests all pass\s+50%\s+100%/);
  });
});

describe('medianTaskChange', () => {
  const r = (task: string, variant: string, lines: number): RunRecord => ({
    task, variant, model: 'm', rulesVersion: '1', timestamp: '', durationMs: 1000, inputTokens: 0, outputTokens: 10,
    costUsd: 0.01, linesAdded: lines, linesRemoved: 0, newDependencies: [], testsPassed: 1, testsTotal: 1, rung: null,
  });
  it('takes the median of per-task changes so one big task cannot dominate', () => {
    const recs = [r('a', 'baseline', 10), r('a', 'leantoken', 5), r('b', 'baseline', 1000), r('b', 'leantoken', 1000), r('c', 'baseline', 20), r('c', 'leantoken', 15)];
    expect(medianTaskChange(recs, 'baseline', 'leantoken', 'lines')).toBe(-25);
  });
  it('lists ablation variants in the report', () => {
    expect(formatReport([r('a', 'baseline', 10), r('a', 'leantoken', 5), r('a', 'no-step-3', 8)])).toMatch(/no-step-3\s+-20%/);
  });
});
