import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dueDate } from '../src/billing.js';
test('30 days later', () => assert.equal(dueDate(new Date('2026-10-10T00:00:00Z')), '2026-11-09'));
test('crosses year', () => assert.equal(dueDate(new Date('2026-12-15T00:00:00Z')), '2027-01-14'));
