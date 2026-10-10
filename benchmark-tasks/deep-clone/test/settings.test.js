import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloneSettings } from '../src/settings.js';

const original = () => ({ theme: { colors: ['red', 'blue'] }, updated: new Date('2026-01-01'), flags: new Map([['beta', true]]) });

test('deep equal and independent', () => {
  const a = original();
  const b = cloneSettings(a);
  assert.deepEqual(b, a);
  b.theme.colors.push('green');
  b.flags.set('beta', false);
  assert.deepEqual(a.theme.colors, ['red', 'blue']);
  assert.equal(a.flags.get('beta'), true);
});
test('preserves types', () => {
  const b = cloneSettings(original());
  assert.ok(b.updated instanceof Date);
  assert.ok(b.flags instanceof Map);
});
