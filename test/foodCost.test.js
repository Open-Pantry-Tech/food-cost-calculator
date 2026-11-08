import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  UNITS,
  convert,
  isCompatible,
  lineCost,
  plateCost,
  priceExTax,
  foodCostPct,
  grossProfit,
  gpPct,
  menuPriceAtTarget,
  status,
  costDish,
  UnitMismatchError,
  SAMPLE_DISH,
} from '../src/foodCost.js';

const close = (actual, expected, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

test('unit table has the three bases', () => {
  assert.equal(Object.keys(UNITS).length, 11);
  assert.deepEqual(new Set(Object.values(UNITS).map((u) => u.base)), new Set(['g', 'ml', 'each']));
});

test('convert within a kind', () => {
  close(convert(1, 'kg', 'g'), 1000);
  close(convert(500, 'ml', 'L'), 0.5);
  close(convert(1, 'dozen', 'each'), 12);
  close(convert(1, 'lb', 'oz'), 453.592 / 28.3495);
  close(convert(1, 'gal', 'fl oz'), 3785.41 / 29.5735);
});

test('weight and volume do not convert', () => {
  assert.equal(isCompatible('L', 'kg'), false);
  assert.equal(isCompatible('kg', 'oz'), true);
  assert.throws(() => convert(1, 'L', 'kg'), UnitMismatchError);
  assert.throws(() => lineCost({ packPrice: 5, packSize: 1, packUnit: 'L', qtyUsed: 100, qtyUnit: 'g' }), UnitMismatchError);
});

test('unknown unit throws RangeError', () => {
  assert.throws(() => convert(1, 'cup', 'ml'), RangeError);
});

test('line cost with yield', () => {
  // Chicken breast $13.50/kg, 220 g used, 92% yield
  close(lineCost({ packPrice: 13.5, packSize: 1, packUnit: 'kg', qtyUsed: 220, qtyUnit: 'g', yieldPct: 92 }), (13.5 / 1000) * 220 / 0.92);
  // Blank yield means 100%; strings are accepted
  close(lineCost({ packPrice: '7.20', packSize: '1', packUnit: 'dozen', qtyUsed: '0.5', qtyUnit: 'each', yieldPct: '' }), 0.3);
  // Yield is clamped to 1–100
  close(lineCost({ packPrice: 10, packSize: 1, packUnit: 'kg', qtyUsed: 100, qtyUnit: 'g', yieldPct: 150 }), 1);
  // Zero pack size costs nothing rather than dividing by zero
  assert.equal(lineCost({ packPrice: 10, packSize: 0, packUnit: 'kg', qtyUsed: 100, qtyUnit: 'g' }), 0);
});

test('plate cost divides by portions', () => {
  close(plateCost([2, 3, 5]), 10);
  close(plateCost([2, 3, 5], 4), 2.5);
  close(plateCost([2, 3, 5], 0), 10);
});

test('food cost %, GP and GP %', () => {
  close(priceExTax(26, 0.1), 26 / 1.1);
  close(foodCostPct(6.5, 26, 0.1), (6.5 / (26 / 1.1)) * 100);
  assert.equal(foodCostPct(6.5, 26, 0.1).toFixed(1), '27.5'); // FAQ example
  assert.ok(Number.isNaN(foodCostPct(5, 0, 0.1)));
  close(grossProfit(6.5, 22, 0), 15.5);
  close(gpPct(6.6, 22, 0), 70);
});

test('menu price at target, inc and ex tax', () => {
  assert.equal(menuPriceAtTarget(6.5, 30, 0, { includeTax: false }).toFixed(2), '21.67'); // FAQ example
  assert.equal(menuPriceAtTarget(6.5, 30, 0.1).toFixed(2), '23.83'); // FAQ example
  assert.ok(Number.isNaN(menuPriceAtTarget(6.5, 0, 0.1)));
});

test('status rules', () => {
  assert.equal(status(33.1, 30), 'over');
  assert.equal(status(33, 30), 'on');
  assert.equal(status(22, 30), 'on');
  assert.equal(status(21.9, 30), 'under');
  assert.equal(status(NaN, 30), null);
});

test('AU worked example: chicken schnitzel, chips & salad', () => {
  const r = costDish(SAMPLE_DISH);
  assert.equal(r.lines.length, 8);
  assert.equal(r.hasMismatch, false);
  assert.equal(r.plateCost.toFixed(2), '5.21');
  assert.equal(r.foodCostPct.toFixed(1), '22.0');
  assert.equal(r.priceExTax.toFixed(2), '23.64');
  assert.equal(r.grossProfit.toFixed(2), '18.43');
  assert.equal(r.gpPct.toFixed(1), '78.0');
  assert.equal(r.menuPriceAtTarget.toFixed(2), '19.10');
  assert.equal(r.menuPriceAtTargetExTax.toFixed(2), '17.36');
  assert.equal(r.status, 'on');
  assert.equal(r.statusLabel, 'On target');
});

test('costDish flags mismatched lines and leaves them out of the total', () => {
  const r = costDish({
    menuPrice: 20,
    taxRate: 0,
    ingredients: [
      { name: 'Cream', packPrice: 8, packSize: 2, packUnit: 'L', qtyUsed: 100, qtyUnit: 'g' },
      { name: 'Butter', packPrice: 10, packSize: 1, packUnit: 'kg', qtyUsed: 100, qtyUnit: 'g' },
    ],
  });
  assert.equal(r.hasMismatch, true);
  assert.equal(r.lines[0].mismatch, true);
  close(r.plateCost, 1);
  close(r.foodCostPct, 5);
  assert.equal(r.status, 'under');
});
