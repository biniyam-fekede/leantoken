import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadUsers } from '../src/users.js';

test('parses users with numeric age', () => {
  assert.deepEqual(loadUsers('name,email,age\nAda,ada@example.com,36\nAlan,alan@example.com,41\n'), [
    { name: 'Ada', email: 'ada@example.com', age: 36 },
    { name: 'Alan', email: 'alan@example.com', age: 41 },
  ]);
});
test('quoted fields with commas', () => {
  assert.deepEqual(loadUsers('name,email,age\n"Lovelace, Ada",ada@example.com,36'), [
    { name: 'Lovelace, Ada', email: 'ada@example.com', age: 36 },
  ]);
});
