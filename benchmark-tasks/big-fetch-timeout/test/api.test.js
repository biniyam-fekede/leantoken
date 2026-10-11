import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getJSON } from '../src/api.js';
// A fake fetch that never answers, but rejects with the signal's reason when aborted, like the real fetch.
const hanging = (url, init = {}) => new Promise((_, reject) => {
  init.signal?.addEventListener('abort', () => reject(init.signal.reason));
});
test('times out with TimeoutError', async () => {
  // Timeout timers may be unref'd (AbortSignal.timeout is), so keep the process alive while we wait.
  const keepAlive = setTimeout(() => {}, 3000);
  try {
    const started = Date.now();
    await assert.rejects(getJSON('/x', { fetchImpl: hanging, timeoutMs: 50 }), (e) => e.name === 'TimeoutError');
    assert.ok(Date.now() - started < 2000);
  } finally {
    clearTimeout(keepAlive);
  }
});
test('still returns data', async () => {
  const ok = async () => ({ ok: true, json: async () => ({ price: 3 }) });
  assert.deepEqual(await getJSON('/x', { fetchImpl: ok, timeoutMs: 50 }), { price: 3 });
});
