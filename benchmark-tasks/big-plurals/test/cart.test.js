import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cartSummary } from '../src/cart.js';
test('english', () => {
  assert.equal(cartSummary(0, 'en'), 'No items');
  assert.equal(cartSummary(1, 'en'), '1 item');
  assert.equal(cartSummary(5, 'en'), '5 items');
});
test('polish', () => {
  assert.equal(cartSummary(0, 'pl'), 'Brak przedmiotów');
  assert.equal(cartSummary(1, 'pl'), '1 przedmiot');
  assert.equal(cartSummary(3, 'pl'), '3 przedmioty');
  assert.equal(cartSummary(5, 'pl'), '5 przedmiotów');
  assert.equal(cartSummary(12, 'pl'), '12 przedmiotów');
  assert.equal(cartSummary(22, 'pl'), '22 przedmioty');
  assert.equal(cartSummary(25, 'pl'), '25 przedmiotów');
});
