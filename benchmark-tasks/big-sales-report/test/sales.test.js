import { test } from 'node:test';
import assert from 'node:assert/strict';
import { salesReport } from '../src/reports/sales.js';
test('groups by month with quoted money', () => {
  const orders = [
    { createdAt: '2026-02-03T10:00:00Z', totalCents: 123450 },
    { createdAt: '2026-01-15T10:00:00Z', totalCents: 500 },
    { createdAt: '2026-02-28T23:59:59Z', totalCents: 50 },
  ];
  assert.equal(salesReport(orders), 'month,orders,total\n2026-01,1,$5.00\n2026-02,2,"$1,235.00"\n');
});
test('empty', () => assert.equal(salesReport([]), 'month,orders,total\n'));
