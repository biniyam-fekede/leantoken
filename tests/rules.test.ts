import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { install, rulesText, rulesVersion, stripBlock, uninstall, withBlock } from '../src/rules.js';
import { loadTasks } from '../src/bench.js';

describe('ruleset', () => {
  it('is versioned and asks for a decision record', () => {
    expect(rulesVersion()).toMatch(/^\d+\.\d+\.\d+$/);
    expect(rulesText()).toContain('LeanToken: rung=');
  });
});

describe('install / uninstall', () => {
  it('is idempotent and preserves existing content', () => {
    const doc = '# My project\n\nUse pnpm.\n';
    const once = withBlock(doc, 'RULES v1');
    expect(withBlock(once, 'RULES v1')).toBe(once);
    expect(withBlock(once, 'RULES v2')).toContain('RULES v2');
    expect(withBlock(once, 'RULES v2')).not.toContain('RULES v1');
    expect(stripBlock(once)).toBe('# My project\n\nUse pnpm.');
  });

  it('round-trips through a real file', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'leantoken-test-')), 'CLAUDE.md');
    writeFileSync(file, 'keep me\n');
    install(file);
    expect(readFileSync(file, 'utf8')).toContain('leantoken:begin');
    expect(uninstall(file)).toBe(true);
    expect(readFileSync(file, 'utf8')).toBe('keep me');
    expect(uninstall(file)).toBe(false);
  });
});

describe('benchmark tasks', () => {
  it('each bundled task has a prompt', () => {
    const tasks = loadTasks();
    expect(tasks.length).toBeGreaterThanOrEqual(8);
    for (const t of tasks) expect(t.prompt.length).toBeGreaterThan(10);
  });
});

describe('ablation', () => {
  it('removes exactly one checklist step', async () => {
    const { rulesWithout } = await import('../src/rules.js');
    const { rulesFor } = await import('../src/bench.js');
    const full = rulesText();
    const without3 = rulesWithout(3);
    expect(full).toContain('3. **Standard library?**');
    expect(without3).not.toContain('3. **Standard library?**');
    expect(without3).toContain('2. **Already in the codebase?**');
    expect(full.split('\n').length - without3.split('\n').length).toBe(1);
    expect(rulesFor('baseline')).toBeNull();
    expect(rulesFor('no-step-3')).toBe(without3);
    expect(() => rulesFor('no-step-9')).toThrow(/Unknown variant/);
  });
});

describe('no-examples variant', () => {
  it('strips every example API but keeps all seven steps', async () => {
    const { rulesWithoutExamples } = await import('../src/rules.js');
    const text = rulesWithoutExamples();
    for (const api of ['structuredClone', 'crypto.randomUUID', 'Object.groupBy', 'Intl', 'input type="date"']) expect(text).not.toContain(api);
    for (let n = 1; n <= 7; n++) expect(text).toContain(`${n}. **`);
  });
});

describe('rescore', () => {
  it('applies a saved diff and re-runs the hidden tests', async () => {
    const { rescore } = await import('../src/bench.js');
    const task = loadTasks(undefined, ['dedupe'])[0];
    const patch = [
      'diff --git a/src/tags.js b/src/tags.js',
      '--- a/src/tags.js',
      '+++ b/src/tags.js',
      '@@ -1,3 +1,3 @@',
      ' export function uniqueTags(tags) {',
      "-  throw new Error('Not implemented');",
      '+  return [...new Set(tags)];',
      ' }',
      '',
    ].join('\n');
    const base = { task: 'dedupe', variant: 'baseline', model: 'm', rulesVersion: 'none', timestamp: '', durationMs: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, linesAdded: 1, linesRemoved: 1, newDependencies: [], testsPassed: 0, testsTotal: 0, rung: null };
    expect(await rescore(task, { ...base, patch })).toMatchObject({ testsPassed: 2, testsTotal: 2 });
    expect(await rescore(task, { ...base, patch: '' })).toMatchObject({ testsPassed: 0, testsTotal: 2 });
  });
});
