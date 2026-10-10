import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail } from '../src/signup.js';

test('accepts', () => {
  for (const v of ['ada@example.com', 'first.last+tag@sub.example.co.uk']) assert.equal(isValidEmail(v), true, v);
});
test('rejects', () => {
  for (const v of [undefined, null, 42, '', 'ada example.com', 'ada@', '@example.com', 'ada@example', 'a da@example.com']) assert.equal(isValidEmail(v), false, String(v));
});
