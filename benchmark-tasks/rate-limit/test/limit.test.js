import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowRequest } from '../src/limit.js';
test('5 per rolling minute, per user', () => {
  const t = 1_000_000;
  for (let i = 0; i < 5; i++) assert.equal(allowRequest('a', t + i * 1000), true);
  assert.equal(allowRequest('a', t + 10_000), false);
  assert.equal(allowRequest('b', t + 10_000), true);
  assert.equal(allowRequest('a', t + 60_500), true);
});
