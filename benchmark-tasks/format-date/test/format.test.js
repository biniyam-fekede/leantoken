import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate } from '../src/format.js';

test('formats a date', () => assert.equal(formatDate(new Date('2026-10-10T12:00:00Z')), 'October 10, 2026'));
test('single-digit day', () => assert.equal(formatDate(new Date('2024-02-05T00:00:00Z')), 'February 5, 2024'));
test('uses UTC day', () => assert.equal(formatDate(new Date('2025-12-31T23:30:00Z')), 'December 31, 2025'));
