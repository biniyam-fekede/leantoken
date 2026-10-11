import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendInBatches } from '../src/notify.js';
test('batches of 10', async () => {
  const sent = [];
  await sendInBatches(Array.from({ length: 23 }, (_, i) => i), async (b) => sent.push(b));
  assert.deepEqual(sent.map((b) => b.length), [10, 10, 3]);
  assert.equal(sent[2][2], 22);
});
test('empty', async () => {
  const sent = [];
  await sendInBatches([], async (b) => sent.push(b));
  assert.equal(sent.length, 0);
});
