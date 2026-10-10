import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sum } from '../src/math.js';

test('empty array', () => assert.equal(sum([]), 0));
test('numbers', () => assert.equal(sum([1, 2, 3]), 6));
