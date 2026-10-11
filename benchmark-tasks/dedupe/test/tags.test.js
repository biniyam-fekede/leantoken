import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uniqueTags } from '../src/tags.js';
test('dedupes in order', () => assert.deepEqual(uniqueTags(['js', 'css', 'js', 'html', 'css']), ['js', 'css', 'html']));
test('empty', () => assert.deepEqual(uniqueTags([]), []));
