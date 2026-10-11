import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery } from '../src/query.js';
test('decodes', () => assert.deepEqual(parseQuery('?q=lean%20token&page=2'), { q: 'lean token', page: '2' }));
test('no question mark, plus as space', () => assert.deepEqual(parseQuery('a=1+2&b='), { a: '1 2', b: '' }));
test('last wins', () => assert.deepEqual(parseQuery('x=1&x=2'), { x: '2' }));
test('empty', () => assert.deepEqual(parseQuery(''), {}));
