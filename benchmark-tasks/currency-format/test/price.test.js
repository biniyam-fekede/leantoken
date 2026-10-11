import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPrice } from '../src/price.js';
test('EUR', () => assert.equal(formatPrice(1234.5, 'EUR'), '€1,234.50'));
test('USD', () => assert.equal(formatPrice(1234.5, 'USD'), '$1,234.50'));
test('JPY has no decimals', () => assert.equal(formatPrice(500, 'JPY'), '¥500'));
test('GBP', () => assert.equal(formatPrice(0.5, 'GBP'), '£0.50'));
