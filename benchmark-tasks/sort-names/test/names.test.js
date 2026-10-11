import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortNames } from '../src/names.js';
test('human order', () => assert.deepEqual(sortNames(['zoe', 'Émile', 'apple', 'Bob']), ['apple', 'Bob', 'Émile', 'zoe']));
test('does not mutate', () => { const a = ['b', 'a']; sortNames(a); assert.deepEqual(a, ['b', 'a']); });
