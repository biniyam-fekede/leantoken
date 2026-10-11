import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysAgo } from '../src/time.js';
test('today', () => assert.equal(daysAgo(0), 'today'));
test('yesterday', () => assert.equal(daysAgo(1), 'yesterday'));
test('plural', () => assert.equal(daysAgo(3), '3 days ago'));
test('many', () => assert.equal(daysAgo(40), '40 days ago'));
