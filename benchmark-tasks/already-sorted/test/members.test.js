import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listMembers } from '../src/members.js';
test('sorted by name', () => {
  const m = [{ name: 'Zoe' }, { name: 'adam' }, { name: 'Maya' }];
  assert.deepEqual(listMembers(m).map((x) => x.name), ['adam', 'Maya', 'Zoe']);
});
test('does not mutate input', () => {
  const m = [{ name: 'b' }, { name: 'a' }];
  listMembers(m);
  assert.equal(m[0].name, 'b');
});
