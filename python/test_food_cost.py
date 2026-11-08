import math
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from food_cost import (  # noqa: E402
    SAMPLE_DISH, UNITS, UnitMismatchError, convert, cost_dish, food_cost_pct, gp_pct,
    gross_profit, is_compatible, line_cost, menu_price_at_target, plate_cost, price_ex_tax, status,
)


class FoodCostTest(unittest.TestCase):
    def test_units(self):
        self.assertEqual(len(UNITS), 11)
        self.assertAlmostEqual(convert(1, 'kg', 'g'), 1000)
        self.assertAlmostEqual(convert(500, 'ml', 'L'), 0.5)
        self.assertAlmostEqual(convert(1, 'dozen', 'each'), 12)

    def test_weight_and_volume_do_not_convert(self):
        self.assertFalse(is_compatible('L', 'kg'))
        with self.assertRaises(UnitMismatchError):
            convert(1, 'L', 'kg')
        with self.assertRaises(UnitMismatchError):
            line_cost(5, 1, 'L', 100, 'g')
        with self.assertRaises(KeyError):
            convert(1, 'cup', 'ml')

    def test_line_cost_with_yield(self):
        self.assertAlmostEqual(line_cost(13.5, 1, 'kg', 220, 'g', 92), 13.5 / 1000 * 220 / 0.92)
        self.assertAlmostEqual(line_cost('7.20', '1', 'dozen', '0.5', 'each', ''), 0.3)
        self.assertAlmostEqual(line_cost(10, 1, 'kg', 100, 'g', 150), 1)
        self.assertEqual(line_cost(10, 0, 'kg', 100, 'g'), 0)

    def test_plate_and_ratios(self):
        self.assertAlmostEqual(plate_cost([2, 3, 5], 4), 2.5)
        self.assertAlmostEqual(price_ex_tax(26, 0.1), 26 / 1.1)
        self.assertEqual(f'{food_cost_pct(6.5, 26, 0.1):.1f}', '27.5')
        self.assertTrue(math.isnan(food_cost_pct(5, 0, 0.1)))
        self.assertAlmostEqual(gross_profit(6.5, 22, 0), 15.5)
        self.assertAlmostEqual(gp_pct(6.6, 22, 0), 70)
        self.assertEqual(f'{menu_price_at_target(6.5, 30, 0, include_tax=False):.2f}', '21.67')
        self.assertEqual(f'{menu_price_at_target(6.5, 30, 0.1):.2f}', '23.83')

    def test_status(self):
        self.assertEqual(status(33.1, 30), 'over')
        self.assertEqual(status(33, 30), 'on')
        self.assertEqual(status(22, 30), 'on')
        self.assertEqual(status(21.9, 30), 'under')
        self.assertIsNone(status(math.nan, 30))

    def test_au_worked_example(self):
        d = SAMPLE_DISH
        r = cost_dish(d['ingredients'], d['menu_price'], d['tax_rate'], d['target_pct'], d['portions'])
        self.assertEqual(len(r['lines']), 8)
        self.assertFalse(r['has_mismatch'])
        self.assertEqual(f"{r['plate_cost']:.2f}", '5.21')
        self.assertEqual(f"{r['food_cost_pct']:.1f}", '22.0')
        self.assertEqual(f"{r['gross_profit']:.2f}", '18.43')
        self.assertEqual(f"{r['gp_pct']:.1f}", '78.0')
        self.assertEqual(f"{r['menu_price_at_target']:.2f}", '19.10')
        self.assertEqual(f"{r['menu_price_at_target_ex_tax']:.2f}", '17.36')
        self.assertEqual(r['status'], 'on')

    def test_mismatch_left_out(self):
        r = cost_dish([
            dict(name='Cream', pack_price=8, pack_size=2, pack_unit='L', qty_used=100, qty_unit='g'),
            dict(name='Butter', pack_price=10, pack_size=1, pack_unit='kg', qty_used=100, qty_unit='g'),
        ], menu_price=20)
        self.assertTrue(r['has_mismatch'])
        self.assertAlmostEqual(r['plate_cost'], 1)
        self.assertEqual(r['status'], 'under')


if __name__ == '__main__':
    unittest.main()
