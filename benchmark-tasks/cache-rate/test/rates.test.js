import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getExchangeRate } from '../src/rates.js';

test('caches per currency for 60s', async () => {
  let t = 1_000_000;
  const now = () => t;
  const calls = [];
  const fetchRate = async (c) => { calls.push(c); return calls.length; };
  assert.equal(await getExchangeRate('EUR', fetchRate, now), 1);
  t += 30_000;
  assert.equal(await getExchangeRate('EUR', fetchRate, now), 1);
  assert.equal(await getExchangeRate('JPY', fetchRate, now), 2);
  t += 31_000;
  assert.equal(await getExchangeRate('EUR', fetchRate, now), 3);
  assert.deepEqual(calls, ['EUR', 'JPY', 'EUR']);
});
