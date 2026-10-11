import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchProfile } from '../src/profile.js';
test('retries then succeeds', async () => {
  let calls = 0;
  const request = async (url) => { calls++; if (calls < 3) throw new Error('flaky'); return { url }; };
  assert.deepEqual(await fetchProfile(7, request), { url: '/api/profiles/7' });
  assert.equal(calls, 3);
});
test('gives up after 3', async () => {
  let calls = 0;
  const request = async () => { calls++; throw new Error('down ' + calls); };
  await assert.rejects(fetchProfile(1, request), /down 3/);
  assert.equal(calls, 3);
});
