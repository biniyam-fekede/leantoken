import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createId } from '../src/id.js';

test('v4 format', () => assert.match(createId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/));
test('unique', () => assert.equal(new Set(Array.from({ length: 1000 }, createId)).size, 1000));
