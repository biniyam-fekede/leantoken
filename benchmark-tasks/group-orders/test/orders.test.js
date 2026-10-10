import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupOrdersByStatus } from '../src/orders.js';

test('groups by status', () => {
  const o = [{ id: 1, status: 'paid' }, { id: 2, status: 'open' }, { id: 3, status: 'paid' }];
  const g = groupOrdersByStatus(o);
  assert.deepEqual({ ...g }, { paid: [o[0], o[2]], open: [o[1]] });
});
test('empty', () => assert.deepEqual({ ...groupOrdersByStatus([]) }, {}));
