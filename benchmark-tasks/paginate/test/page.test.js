import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paginate } from '../src/page.js';
const xs = Array.from({ length: 23 }, (_, i) => i);
test('middle page', () => assert.deepEqual(paginate(xs, 2, 10), { items: xs.slice(10, 20), page: 2, totalPages: 3 }));
test('last page', () => assert.deepEqual(paginate(xs, 3, 10).items, [20, 21, 22]));
test('out of range', () => assert.deepEqual(paginate(xs, 9, 10).items, []));
test('empty list', () => assert.deepEqual(paginate([], 1, 10), { items: [], page: 1, totalPages: 0 }));
