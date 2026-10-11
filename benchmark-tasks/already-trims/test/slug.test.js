import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/slug.js';
test('trims', () => assert.equal(slugify('  Hello World  '), 'hello-world'));
test('basic', () => assert.equal(slugify('LeanToken: v1.0!'), 'leantoken-v1-0'));
