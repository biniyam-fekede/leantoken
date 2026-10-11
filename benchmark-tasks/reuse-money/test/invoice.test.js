import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invoiceLine } from '../src/invoice.js';
test('formats total', () => assert.equal(invoiceLine({ totalCents: 123450 }), 'Total: $1,234.50'));
test('small', () => assert.equal(invoiceLine({ totalCents: 5 }), 'Total: $0.05'));
