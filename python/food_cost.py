"""Food cost calculator: recipe costing, food cost %, gross profit and menu pricing.

Dependency-free, Python 3.8+. Mirrors src/foodCost.js exactly.
Free online calculator: https://www.theopenpantry.com/food-cost-calculator

Conventions
  - Percentages are plain numbers: 30 means 30%. Tax rates are fractions: 0.1 means 10%.
  - Pack prices are ex tax (what you pay your supplier, less any tax you claim back).
  - Menu prices include tax when tax_rate > 0 (Australia: 10% GST) and exclude it when tax_rate is 0.

MIT License, Copyright (c) 2026 Open Pantry.
"""
import math

__all__ = [
    'UNITS', 'STATUS_LABELS', 'UnitMismatchError', 'to_number', 'is_compatible', 'convert',
    'line_cost', 'plate_cost', 'price_ex_tax', 'food_cost_pct', 'gross_profit', 'gp_pct',
    'menu_price_at_target', 'status', 'cost_dish', 'SAMPLE_DISH',
]

#: Every unit converts to one of three bases: grams, millilitres or each.
UNITS = {
    'kg': ('g', 1000.0),
    'g': ('g', 1.0),
    'lb': ('g', 453.592),
    'oz': ('g', 28.3495),
    'L': ('ml', 1000.0),
    'ml': ('ml', 1.0),
    'gal': ('ml', 3785.41),
    'qt': ('ml', 946.353),
    'fl oz': ('ml', 29.5735),
    'each': ('each', 1.0),
    'dozen': ('each', 12.0),
}

OVER_TARGET_POINTS = 3
WELL_UNDER_POINTS = 8
STATUS_LABELS = {'over': 'Over target', 'on': 'On target', 'under': 'Well under target'}


class UnitMismatchError(ValueError):
    """Raised when a pack unit and a quantity unit measure different things."""

    code = 'UNIT_MISMATCH'

    def __init__(self, from_unit, to_unit):
        super().__init__(
            f'Cannot convert {from_unit} to {to_unit}: weight, volume and count do not convert into each other.'
        )


def to_number(value):
    """Parse a number from a number or string; blanks and junk become 0."""
    try:
        n = float(value)
    except (TypeError, ValueError):
        return 0.0
    return n if math.isfinite(n) else 0.0


def _unit(name):
    try:
        return UNITS[name]
    except KeyError:
        raise KeyError(f'Unknown unit "{name}". Use one of: {", ".join(UNITS)}') from None


def is_compatible(from_unit, to_unit):
    """True when two units measure the same kind of thing."""
    a, b = UNITS.get(from_unit), UNITS.get(to_unit)
    return bool(a and b and a[0] == b[0])


def convert(quantity, from_unit, to_unit):
    """Convert a quantity between units of the same kind. convert(1, 'kg', 'g') == 1000."""
    a, b = _unit(from_unit), _unit(to_unit)
    if a[0] != b[0]:
        raise UnitMismatchError(from_unit, to_unit)
    return to_number(quantity) * a[1] / b[1]


def line_cost(pack_price, pack_size, pack_unit, qty_used, qty_unit, yield_pct=100):
    """Cost of one ingredient line.

    line cost = pack price / (pack size * pack unit factor) * qty used * qty unit factor / yield

    Yield is the usable share after trim or cooking loss, 1-100 (blank or 0 means 100).
    """
    pu, qu = _unit(pack_unit), _unit(qty_unit)
    if pu[0] != qu[0]:
        raise UnitMismatchError(pack_unit, qty_unit)
    size = to_number(pack_size) * pu[1]
    if size <= 0:
        return 0.0
    y = min(100.0, max(1.0, to_number(yield_pct) or 100.0)) / 100.0
    return to_number(pack_price) / size * to_number(qty_used) * qu[1] / y


def plate_cost(line_costs, portions=1):
    """Total recipe cost divided by the number of portions it makes (default 1)."""
    total = sum(to_number(c) for c in line_costs)
    return total / max(1.0, to_number(portions) or 1.0)


def price_ex_tax(menu_price, tax_rate=0):
    """Menu price with the tax taken out: 26 at 10% GST is 23.64."""
    return to_number(menu_price) / (1 + to_number(tax_rate))


def food_cost_pct(plate, menu_price, tax_rate=0):
    """Food cost % = plate cost / menu price ex tax * 100. NaN when there is no menu price."""
    ex = price_ex_tax(menu_price, tax_rate)
    return to_number(plate) / ex * 100 if ex > 0 else math.nan


def gross_profit(plate, menu_price, tax_rate=0):
    """Gross profit per plate = menu price ex tax - plate cost."""
    return price_ex_tax(menu_price, tax_rate) - to_number(plate)


def gp_pct(plate, menu_price, tax_rate=0):
    """GP % = gross profit / menu price ex tax * 100 (the same as 100 - food cost %)."""
    ex = price_ex_tax(menu_price, tax_rate)
    return (ex - to_number(plate)) / ex * 100 if ex > 0 else math.nan


def menu_price_at_target(plate, target_pct, tax_rate=0, include_tax=True):
    """Menu price that hits a target food cost: plate / target, times (1 + tax) when include_tax."""
    t = to_number(target_pct) / 100
    if t <= 0:
        return math.nan
    ex = to_number(plate) / t
    return ex * (1 + to_number(tax_rate)) if include_tax else ex


def status(food_cost, target_pct):
    """'over' (> target + 3 pts), 'under' (< target - 8 pts), 'on' otherwise; None without a food cost."""
    if food_cost is None or not math.isfinite(food_cost):
        return None
    t = to_number(target_pct)
    if food_cost > t + OVER_TARGET_POINTS:
        return 'over'
    if food_cost < t - WELL_UNDER_POINTS:
        return 'under'
    return 'on'


def cost_dish(ingredients, menu_price, tax_rate=0, target_pct=30, portions=1):
    """Cost a whole dish. Each ingredient is a dict with pack_price, pack_size, pack_unit,
    qty_used, qty_unit and optional name and yield_pct."""
    lines, has_mismatch = [], False
    for ing in ingredients:
        name = ing.get('name', '')
        try:
            cost = line_cost(ing['pack_price'], ing['pack_size'], ing['pack_unit'],
                             ing['qty_used'], ing['qty_unit'], ing.get('yield_pct', 100))
            lines.append({'name': name, 'cost': cost, 'mismatch': False})
        except UnitMismatchError:
            has_mismatch = True
            lines.append({'name': name, 'cost': math.nan, 'mismatch': True})
    ok = [line['cost'] for line in lines if not line['mismatch']]
    plate = plate_cost(ok, portions)
    target = to_number(target_pct) or 30
    fc = food_cost_pct(plate, menu_price, tax_rate)
    st = status(fc, target)
    return {
        'lines': lines,
        'recipe_cost': sum(ok),
        'plate_cost': plate,
        'price_ex_tax': price_ex_tax(menu_price, tax_rate),
        'food_cost_pct': fc,
        'gross_profit': gross_profit(plate, menu_price, tax_rate),
        'gp_pct': gp_pct(plate, menu_price, tax_rate),
        'menu_price_at_target': menu_price_at_target(plate, target, tax_rate),
        'menu_price_at_target_ex_tax': menu_price_at_target(plate, target, tax_rate, include_tax=False),
        'status': st,
        'status_label': STATUS_LABELS[st] if st else '',
        'has_mismatch': has_mismatch,
    }


#: The Australian worked example: Chicken schnitzel, chips & salad at $26 incl 10% GST.
SAMPLE_DISH = {
    'name': 'Chicken schnitzel, chips & salad',
    'menu_price': 26,
    'tax_rate': 0.1,
    'target_pct': 30,
    'portions': 1,
    'ingredients': [
        dict(name='Chicken breast', pack_price=13.5, pack_size=1, pack_unit='kg', qty_used=220, qty_unit='g', yield_pct=92),
        dict(name='Panko crumbs', pack_price=6.8, pack_size=1, pack_unit='kg', qty_used=40, qty_unit='g'),
        dict(name='Eggs', pack_price=7.2, pack_size=1, pack_unit='dozen', qty_used=0.5, qty_unit='each'),
        dict(name='Plain flour', pack_price=2.1, pack_size=1, pack_unit='kg', qty_used=20, qty_unit='g'),
        dict(name='Canola frying oil', pack_price=42, pack_size=20, pack_unit='L', qty_used=60, qty_unit='ml'),
        dict(name='Frozen chips', pack_price=4.9, pack_size=2, pack_unit='kg', qty_used=180, qty_unit='g'),
        dict(name='Lemon', pack_price=0.8, pack_size=1, pack_unit='each', qty_used=0.25, qty_unit='each'),
        dict(name='Salad mix', pack_price=12, pack_size=1, pack_unit='kg', qty_used=50, qty_unit='g'),
    ],
}


if __name__ == '__main__':
    d = SAMPLE_DISH
    r = cost_dish(d['ingredients'], d['menu_price'], d['tax_rate'], d['target_pct'], d['portions'])
    print(d['name'])
    for line in r['lines']:
        print(f"  {line['name']:<20} ${line['cost']:.2f}")
    print(f"Plate cost        ${r['plate_cost']:.2f}")
    print(f"Food cost         {r['food_cost_pct']:.1f}%  ({r['status_label']})")
    print(f"Gross profit      ${r['gross_profit']:.2f}  ({r['gp_pct']:.1f}% GP)")
    print(f"Price at {d['target_pct']}%     ${r['menu_price_at_target']:.2f} incl GST")
