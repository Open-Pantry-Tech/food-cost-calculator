# Food Cost Calculator & Food Cost Formula (free, open source)

To calculate food cost percentage, divide the plate cost of a dish by its menu price excluding tax and multiply by 100: **food cost % = plate cost ÷ menu price ex GST × 100**. Most Australian restaurants and cafes aim for a food cost of **28–32%** across the whole menu.

This repository is a small, free food cost calculator: a dependency-free JavaScript library, a matching Python module and a one-page demo. It does recipe costing with yield, plate cost, food cost percentage, gross profit, GP % and menu pricing to a target food cost, with the same maths as the free online [Food Cost Calculator](https://www.theopenpantry.com/food-cost-calculator) from Open Pantry.

- **Online calculator (no install):** [theopenpantry.com/food-cost-calculator](https://www.theopenpantry.com/food-cost-calculator)
- **Recipe costing template** for Excel and Google Sheets: [download it free](https://www.theopenpantry.com/food-cost-calculator#template)
- **Costing a whole menu?** [Menu Profit Manager](https://www.theopenpantry.com/menuprofitmanager) keeps every dish costed from your supplier invoices.
- **Demo:** [open-pantry-tech.github.io/food-cost-calculator](https://open-pantry-tech.github.io/food-cost-calculator/)
- **Chrome extension:** the same calculator in your browser toolbar. Source in [`chrome-extension/`](chrome-extension/).

## Contents

- [How to calculate food cost percentage](#how-to-calculate-food-cost-percentage)
- [Food cost formula](#food-cost-formula)
- [How to cost a recipe with yield](#how-to-cost-a-recipe-with-yield)
- [Worked example: chicken schnitzel, chips & salad](#worked-example-chicken-schnitzel-chips--salad)
- [How to price a menu item to hit a target food cost](#how-to-price-a-menu-item-to-hit-a-target-food-cost)
- [What is a good food cost percentage?](#what-is-a-good-food-cost-percentage)
- [Recipe costing template](#recipe-costing-template)
- [Use it in code (JS + Python)](#use-it-in-code-js--python)
- [Run the tests](#run-the-tests)

## How to calculate food cost percentage

1. **Cost each ingredient.** Take the price of the pack you buy, divide by the pack size, multiply by the amount the recipe uses, then divide by the yield.
2. **Add up the lines** to get the recipe cost. If the recipe makes more than one portion, divide by the number of portions to get the **plate cost**.
3. **Take the tax out of the menu price.** In Australia, menu prices include 10% GST, so divide by 1.1. A $26 menu price is $23.64 ex GST.
4. **Divide the plate cost by the menu price ex GST** and multiply by 100. That is the dish's food cost percentage.

Gross profit is what is left over: menu price ex GST − plate cost. GP % = 100 − food cost %.

## Food cost formula

| What | Formula |
| --- | --- |
| Ingredient line cost | pack price ÷ (pack size × pack unit factor) × qty used × qty unit factor ÷ yield |
| Plate cost | sum of line costs ÷ portions |
| Menu price ex tax | menu price ÷ (1 + tax rate) |
| Food cost % | plate cost ÷ menu price ex tax × 100 |
| Gross profit per plate | menu price ex tax − plate cost |
| GP % | gross profit ÷ menu price ex tax × 100 |
| Menu price at target (ex tax) | plate cost ÷ target food cost % |
| Menu price at target (incl tax) | plate cost ÷ target food cost % × (1 + tax rate) |
| Food cost % for a week or month | (opening stock + purchases − closing stock) ÷ food sales ex GST × 100 |

The per-dish formula tells you whether a dish is priced right. The whole-kitchen formula tells you whether the kitchen as a whole is hitting its target, including waste and over-portioning. Use supplier prices ex GST where you can claim the GST back.

**Units.** Every unit converts to grams, millilitres or each:

| Unit | Measures | Equals |
| --- | --- | --- |
| kg | weight | 1000 g |
| g | weight | 1 g |
| lb | weight | 453.592 g |
| oz | weight | 28.3495 g |
| L | volume | 1000 ml |
| ml | volume | 1 ml |
| gal | volume | 3785.41 ml |
| qt | volume | 946.353 ml |
| fl oz | volume | 29.5735 ml |
| each | count | 1 |
| dozen | count | 12 |

Weight and volume don't convert: 1 L of cream is not 1 kg. If the pack is in litres and the recipe is in grams, the library flags the line (`UnitMismatchError`) instead of costing it wrongly.

## How to cost a recipe with yield

You pay for the whole product but only serve the usable part. **Yield** is the share left after trimming, peeling or cooking loss. Divide the line cost by the yield to get the real cost of what reaches the plate.

If you trim 1 kg of whole salmon down to 650 g of portions, your yield is 65%, so the real cost per gram served is the purchase price divided by 0.65. Ignoring yield is the most common reason costed dishes lose money.

In this library, yield is a percentage from 1 to 100. Blank or 0 means 100% (no loss).

## Worked example: chicken schnitzel, chips & salad

An Australian pub or cafe main, sold for **$26 including 10% GST**, with a 30% target food cost. Pack prices are ex GST.

| Ingredient | Pack price | Pack size | Qty used | Yield | Line cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| Chicken breast | $13.50 | 1 kg | 220 g | 92% | $3.23 |
| Panko crumbs | $6.80 | 1 kg | 40 g | 100% | $0.27 |
| Eggs | $7.20 | 1 dozen | 0.5 each | 100% | $0.30 |
| Plain flour | $2.10 | 1 kg | 20 g | 100% | $0.04 |
| Canola frying oil | $42.00 | 20 L | 60 ml | 100% | $0.13 |
| Frozen chips | $4.90 | 2 kg | 180 g | 100% | $0.44 |
| Lemon | $0.80 | 1 each | 0.25 each | 100% | $0.20 |
| Salad mix | $12.00 | 1 kg | 50 g | 100% | $0.60 |
| **Plate cost** | | | | | **$5.21** |

| Result | Value |
| --- | ---: |
| Menu price ex GST ($26 ÷ 1.1) | $23.64 |
| **Food cost %** ($5.21 ÷ $23.64 × 100) | **22.0%** |
| Gross profit per plate | $18.43 |
| GP % | 78.0% |
| Menu price at a 30% target (incl GST) | $19.10 |
| Status | On target |

The chicken line shows how yield works: $13.50 ÷ 1000 g × 220 g = $2.97, then ÷ 0.92 = $3.23.

The library's tests use this example as a fixture, so the JavaScript and Python versions must both return a $5.21 plate cost and a 22.0% food cost.

## How to price a menu item to hit a target food cost

Divide the plate cost by your target food cost percentage, then add tax back:

- **Menu price ex tax = plate cost ÷ target**
- **Menu price incl GST = plate cost ÷ target × 1.1**

A $6.50 plate at a 30% target gives $21.67 ex GST, or $23.83 on an Australian menu. Most venues then round to a clean price point.

The calculator also gives each dish a status:

| Status | Rule |
| --- | --- |
| Over target | food cost is more than 3 points above target |
| On target | within 3 points above and 8 points below target |
| Well under target | food cost is more than 8 points below target (the dish carries margin for the rest of the menu) |

## What is a good food cost percentage?

Most Australian restaurants and cafes aim for **28–32%** across the whole menu. Single dishes spread wider, and that is fine: a high-cost steak can sit next to a low-cost pasta as long as the blended figure across what you sell stays on target.

| Menu category | Typical food cost |
| --- | --- |
| Coffee and hot drinks | 10–20% |
| Pasta, rice and noodle dishes | 20–28% |
| Cafe breakfast and brunch | 25–32% |
| Burgers and pub mains | 28–35% |
| Steak and seafood | 32–40% |

These are typical ranges used by Australian operators. Your own mix, rent and wages set your real target.

## Recipe costing template

Prefer a spreadsheet? The free [recipe costing template](https://www.theopenpantry.com/food-cost-calculator#template) opens in Excel and Google Sheets. It uses the same formulas as this library: you fill in the blue cells (dish, portions, menu price, GST, target and up to 20 ingredient lines) and the line costs, plate cost, food cost %, gross profit, GP %, menu price at target and status all calculate. It downloads with whatever dish you have costed in the [online food cost calculator](https://www.theopenpantry.com/food-cost-calculator).

A spreadsheet or a calculator costs a dish once, at the prices you typed in. [Menu Profit Manager](https://www.theopenpantry.com/menuprofitmanager) reads your supplier invoices, keeps every ingredient price current and recalculates every dish when a price moves, so you see which dishes a price rise hurts on the day it happens.

## Use it in code (JS + Python)

Both versions have no dependencies and the same API. Percentages are plain numbers (`30` means 30%); tax rates are fractions (`0.1` means 10% GST). Pack prices are ex tax; menu prices include tax when `taxRate` > 0.

### JavaScript (ES module, browser or Node 18+)

Copy `src/foodCost.js` into your project, or install it straight from GitHub:

```bash
npm install github:Open-Pantry-Tech/food-cost-calculator
```

```js
import { costDish, lineCost, foodCostPct, menuPriceAtTarget, convert } from './src/foodCost.js';

// One ingredient line: $13.50/kg chicken, 220 g used, 92% yield
lineCost({ packPrice: 13.5, packSize: 1, packUnit: 'kg', qtyUsed: 220, qtyUnit: 'g', yieldPct: 92 }); // 3.228...

// Food cost % and menu price for a $6.50 plate, $26 incl 10% GST
foodCostPct(6.5, 26, 0.1);       // ≈ 27.5
menuPriceAtTarget(6.5, 30, 0.1); // ≈ 23.83 (incl GST)
convert(1, 'lb', 'g');           // 453.592

// A whole dish
const r = costDish({
  menuPrice: 26,
  taxRate: 0.1,
  targetPct: 30,
  portions: 1,
  ingredients: [
    { name: 'Chicken breast', packPrice: 13.5, packSize: 1, packUnit: 'kg', qtyUsed: 220, qtyUnit: 'g', yieldPct: 92 },
    { name: 'Frozen chips', packPrice: 4.9, packSize: 2, packUnit: 'kg', qtyUsed: 180, qtyUnit: 'g' },
    // ...
  ],
});
// r.plateCost, r.foodCostPct, r.grossProfit, r.gpPct, r.menuPriceAtTarget,
// r.menuPriceAtTargetExTax, r.status ('over' | 'on' | 'under'), r.statusLabel, r.lines, r.hasMismatch
```

`SAMPLE_DISH` exports the schnitzel example above, so `costDish(SAMPLE_DISH)` returns a $5.21 plate cost and 22.0% food cost.

### Python (3.8+)

Copy `python/food_cost.py` into your project (standard library only).

```python
from food_cost import cost_dish, line_cost, food_cost_pct, menu_price_at_target, SAMPLE_DISH

line_cost(13.5, 1, 'kg', 220, 'g', yield_pct=92)   # 3.228...
food_cost_pct(6.5, 26, tax_rate=0.1)               # ≈ 27.5
menu_price_at_target(6.5, 30, tax_rate=0.1)        # ≈ 23.83

d = SAMPLE_DISH
r = cost_dish(d['ingredients'], menu_price=26, tax_rate=0.1, target_pct=30)
print(f"{r['plate_cost']:.2f}  {r['food_cost_pct']:.1f}%  {r['status_label']}")
# 5.21  22.0%  On target
```

Run `python3 python/food_cost.py` to print the worked example.

### API

| JavaScript | Python | Returns |
| --- | --- | --- |
| `convert(qty, from, to)` | `convert(qty, from_unit, to_unit)` | quantity in the new unit; throws on weight ↔ volume |
| `isCompatible(a, b)` | `is_compatible(a, b)` | `true` when the units measure the same thing |
| `lineCost({...})` | `line_cost(...)` | ingredient line cost with yield |
| `plateCost(costs, portions)` | `plate_cost(costs, portions)` | recipe cost ÷ portions |
| `priceExTax(price, tax)` | `price_ex_tax(price, tax)` | menu price without tax |
| `foodCostPct(plate, price, tax)` | `food_cost_pct(plate, price, tax)` | food cost % (NaN with no price) |
| `grossProfit(plate, price, tax)` | `gross_profit(plate, price, tax)` | gross profit per plate |
| `gpPct(plate, price, tax)` | `gp_pct(plate, price, tax)` | GP % |
| `menuPriceAtTarget(plate, target, tax, {includeTax})` | `menu_price_at_target(plate, target, tax, include_tax)` | menu price that hits the target |
| `status(foodCost, target)` | `status(food_cost, target)` | `'over'`, `'on'`, `'under'` or null |
| `costDish({...})` | `cost_dish(...)` | everything above for a whole dish |

## Run the tests

```sh
node --test                 # JavaScript (Node 18+)
python3 -m unittest         # Python
```

To try the demo locally, serve the folder (browsers block ES modules from `file://`):

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Who this is for

Chefs, cafe owners, restaurant and pub managers, caterers and developers building restaurant software who need a clear, tested food cost formula: restaurant food cost, cafe food cost, recipe costing and menu costing, without a spreadsheet.

## About

Open Pantry is a B2B food ordering and operations platform connecting wholesale suppliers with restaurants, cafes and venues. [theopenpantry.com](https://www.theopenpantry.com)

## Licence

[MIT](LICENSE). Copyright (c) 2026 Open Pantry.
