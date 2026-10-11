import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPassword } from '../src/password.js';
test('ok', () => assert.deepEqual(checkPassword('correct horse 42'), []));
test('all problems', () => assert.deepEqual(checkPassword('!!').sort(), ['a letter', 'a number', 'at least 12 characters']));
test('missing number', () => assert.deepEqual(checkPassword('abcdefghijklm'), ['a number']));
