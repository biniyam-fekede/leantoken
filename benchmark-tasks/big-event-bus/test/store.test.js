import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SettingsStore } from '../src/store.js';
test('on / off', () => {
  const s = new SettingsStore();
  const seen = [];
  const fn = (e) => seen.push(e);
  s.on('change', fn);
  s.set('theme', 'dark');
  s.off('change', fn);
  s.set('theme', 'light');
  assert.deepEqual(seen, [{ key: 'theme', value: 'dark' }]);
  assert.equal(s.get('theme'), 'light');
});
test('once', () => {
  const s = new SettingsStore();
  let n = 0;
  s.once('change', () => n++);
  s.set('a', 1);
  s.set('a', 2);
  assert.equal(n, 1);
});
