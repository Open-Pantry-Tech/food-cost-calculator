/**
 * Food cost calculator: recipe costing, food cost %, gross profit and menu pricing.
 *
 * Dependency-free ES module. Works in browsers, Node 18+, Deno and Bun.
 * Free online calculator: https://www.theopenpantry.com/food-cost-calculator
 *
 * Conventions
 *  - Percentages are plain numbers: 30 means 30%. Tax rates are fractions: 0.1 means 10%.
 *  - Pack prices are ex tax (the price you pay your supplier, less any tax you claim back).
 *  - Menu prices include tax when `taxRate` > 0 (Australia: 10% GST), and exclude it when `taxRate` is 0.
 *
 * MIT License, Copyright (c) 2026 Open Pantry.
 */

/** Every unit converts to one of three bases: grams, millilitres or each. */
export const UNITS = Object.freeze({
  kg: Object.freeze({ base: 'g', factor: 1000 }),
  g: Object.freeze({ base: 'g', factor: 1 }),
  lb: Object.freeze({ base: 'g', factor: 453.592 }),
  oz: Object.freeze({ base: 'g', factor: 28.3495 }),
  L: Object.freeze({ base: 'ml', factor: 1000 }),
  ml: Object.freeze({ base: 'ml', factor: 1 }),
  gal: Object.freeze({ base: 'ml', factor: 3785.41 }),
  qt: Object.freeze({ base: 'ml', factor: 946.353 }),
  'fl oz': Object.freeze({ base: 'ml', factor: 29.5735 }),
  each: Object.freeze({ base: 'each', factor: 1 }),
  dozen: Object.freeze({ base: 'each', factor: 12 }),
});

/** Status thresholds, in percentage points either side of the target food cost. */
export const OVER_TARGET_POINTS = 3;
export const WELL_UNDER_POINTS = 8;

export const STATUS_LABELS = Object.freeze({
  over: 'Over target',
  on: 'On target',
  under: 'Well under target',
});

/** Thrown when a pack unit and a quantity unit measure different things (weight vs volume vs count). */
export class UnitMismatchError extends Error {
  constructor(from, to) {
    super(`Cannot convert ${from} to ${to}: weight, volume and count do not convert into each other.`);
    this.name = 'UnitMismatchError';
    this.code = 'UNIT_MISMATCH';
  }
}

/** Parse a number from a number or a string; anything else (blank, NaN) becomes 0. */
export function toNumber(value) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function unit(name) {
  const u = UNITS[name];
  if (!u) throw new RangeError(`Unknown unit "${name}". Use one of: ${Object.keys(UNITS).join(', ')}`);
  return u;
}

/** True when two units measure the same kind of thing and can be converted. */
export function isCompatible(fromUnit, toUnit) {
  const a = UNITS[fromUnit];
  const b = UNITS[toUnit];
  return Boolean(a && b && a.base === b.base);
}

/**
 * Convert a quantity between units of the same kind.
 * convert(1, 'kg', 'g') === 1000; convert(1, 'L', 'kg') throws UnitMismatchError.
 */
export function convert(quantity, fromUnit, toUnit) {
  const a = unit(fromUnit);
  const b = unit(toUnit);
  if (a.base !== b.base) throw new UnitMismatchError(fromUnit, toUnit);
  return (toNumber(quantity) * a.factor) / b.factor;
}

/**
 * Cost of one ingredient line.
 *
 *   line cost = pack price ÷ (pack size × pack unit factor) × qty used × qty unit factor ÷ yield
 *
 * Yield is the usable share after trim or cooking loss, 1–100 (blank or 0 means 100).
 * Throws UnitMismatchError when the pack and quantity units are different kinds.
 *
 * @param {{packPrice:number|string, packSize:number|string, packUnit:string,
 *          qtyUsed:number|string, qtyUnit:string, yieldPct?:number|string}} line
 * @returns {number}
 */
export function lineCost({ packPrice, packSize, packUnit, qtyUsed, qtyUnit, yieldPct = 100 }) {
  const pu = unit(packUnit);
  const qu = unit(qtyUnit);
  if (pu.base !== qu.base) throw new UnitMismatchError(packUnit, qtyUnit);
  const size = toNumber(packSize) * pu.factor;
  if (size <= 0) return 0;
  const y = Math.min(100, Math.max(1, toNumber(yieldPct) || 100)) / 100;
  return ((toNumber(packPrice) / size) * toNumber(qtyUsed) * qu.factor) / y;
}

/** Plate cost: total recipe cost divided by the number of portions it makes (default 1). */
export function plateCost(lineCosts, portions = 1) {
  const total = lineCosts.reduce((sum, c) => sum + toNumber(c), 0);
  return total / Math.max(1, toNumber(portions) || 1);
}

/** Menu price with the tax taken out: 26 at 10% GST is 23.64. */
export function priceExTax(menuPrice, taxRate = 0) {
  return toNumber(menuPrice) / (1 + toNumber(taxRate));
}

/** Food cost % = plate cost ÷ menu price ex tax × 100. NaN when there is no menu price. */
export function foodCostPct(plate, menuPrice, taxRate = 0) {
  const ex = priceExTax(menuPrice, taxRate);
  return ex > 0 ? (toNumber(plate) / ex) * 100 : NaN;
}

/** Gross profit per plate = menu price ex tax − plate cost. */
export function grossProfit(plate, menuPrice, taxRate = 0) {
  return priceExTax(menuPrice, taxRate) - toNumber(plate);
}

/** GP % = gross profit ÷ menu price ex tax × 100 (the same as 100 − food cost %). */
export function gpPct(plate, menuPrice, taxRate = 0) {
  const ex = priceExTax(menuPrice, taxRate);
  return ex > 0 ? ((ex - toNumber(plate)) / ex) * 100 : NaN;
}

/**
 * Menu price that hits a target food cost.
 *   ex tax:   plate cost ÷ target
 *   inc tax:  plate cost ÷ target × (1 + tax rate)
 * @param {{includeTax?: boolean}} [options] includeTax defaults to true.
 */
export function menuPriceAtTarget(plate, targetPct, taxRate = 0, { includeTax = true } = {}) {
  const t = toNumber(targetPct) / 100;
  if (t <= 0) return NaN;
  const ex = toNumber(plate) / t;
  return includeTax ? ex * (1 + toNumber(taxRate)) : ex;
}

/**
 * Status of a dish against its target food cost.
 *   'over'  more than 3 points above target
 *   'under' more than 8 points below target (the dish carries margin for the rest of the menu)
 *   'on'    otherwise
 * Returns null when the food cost is not a number (no menu price yet).
 */
export function status(foodCost, targetPct) {
  if (!Number.isFinite(foodCost)) return null;
  const t = toNumber(targetPct);
  if (foodCost > t + OVER_TARGET_POINTS) return 'over';
  if (foodCost < t - WELL_UNDER_POINTS) return 'under';
  return 'on';
}

/**
 * Cost a whole dish in one call.
 *
 * @param {{ingredients: Array<{name?:string, packPrice:any, packSize:any, packUnit:string,
 *            qtyUsed:any, qtyUnit:string, yieldPct?:any}>,
 *          menuPrice: number|string, taxRate?: number, targetPct?: number|string, portions?: number|string}} dish
 */
export function costDish({ ingredients = [], menuPrice, taxRate = 0, targetPct = 30, portions = 1 }) {
  let hasMismatch = false;
  const lines = ingredients.map((ing) => {
    try {
      return { name: ing.name || '', cost: lineCost(ing), mismatch: false };
    } catch (err) {
      if (err instanceof UnitMismatchError) {
        hasMismatch = true;
        return { name: ing.name || '', cost: NaN, mismatch: true };
      }
      throw err;
    }
  });
  const okCosts = lines.filter((l) => !l.mismatch).map((l) => l.cost);
  const recipeCost = okCosts.reduce((s, c) => s + c, 0);
  const plate = plateCost(okCosts, portions);
  const target = toNumber(targetPct) || 30;
  const fc = foodCostPct(plate, menuPrice, taxRate);
  const st = status(fc, target);
  return {
    lines,
    recipeCost,
    plateCost: plate,
    priceExTax: priceExTax(menuPrice, taxRate),
    foodCostPct: fc,
    grossProfit: grossProfit(plate, menuPrice, taxRate),
    gpPct: gpPct(plate, menuPrice, taxRate),
    menuPriceAtTarget: menuPriceAtTarget(plate, target, taxRate),
    menuPriceAtTargetExTax: menuPriceAtTarget(plate, target, taxRate, { includeTax: false }),
    status: st,
    statusLabel: st ? STATUS_LABELS[st] : '',
    hasMismatch,
  };
}

/** The Australian worked example: Chicken schnitzel, chips & salad at $26 incl 10% GST. */
export const SAMPLE_DISH = Object.freeze({
  name: 'Chicken schnitzel, chips & salad',
  menuPrice: 26,
  taxRate: 0.1,
  targetPct: 30,
  portions: 1,
  ingredients: Object.freeze([
    { name: 'Chicken breast', packPrice: 13.5, packSize: 1, packUnit: 'kg', qtyUsed: 220, qtyUnit: 'g', yieldPct: 92 },
    { name: 'Panko crumbs', packPrice: 6.8, packSize: 1, packUnit: 'kg', qtyUsed: 40, qtyUnit: 'g', yieldPct: 100 },
    { name: 'Eggs', packPrice: 7.2, packSize: 1, packUnit: 'dozen', qtyUsed: 0.5, qtyUnit: 'each', yieldPct: 100 },
    { name: 'Plain flour', packPrice: 2.1, packSize: 1, packUnit: 'kg', qtyUsed: 20, qtyUnit: 'g', yieldPct: 100 },
    { name: 'Canola frying oil', packPrice: 42, packSize: 20, packUnit: 'L', qtyUsed: 60, qtyUnit: 'ml', yieldPct: 100 },
    { name: 'Frozen chips', packPrice: 4.9, packSize: 2, packUnit: 'kg', qtyUsed: 180, qtyUnit: 'g', yieldPct: 100 },
    { name: 'Lemon', packPrice: 0.8, packSize: 1, packUnit: 'each', qtyUsed: 0.25, qtyUnit: 'each', yieldPct: 100 },
    { name: 'Salad mix', packPrice: 12, packSize: 1, packUnit: 'kg', qtyUsed: 50, qtyUnit: 'g', yieldPct: 100 },
  ].map((r) => Object.freeze(r))),
});
