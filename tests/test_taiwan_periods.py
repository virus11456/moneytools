import unittest
from moneytools.taiwan.periods import single_quarter, trailing_four_quarters, three_month_yoy

class TaiwanPeriodTests(unittest.TestCase):
    def test_cumulative_not_double_counted(self):
        data={(2025,1):10,(2025,2):25,(2025,3):40,(2025,4):60,(2026,1):30,(2026,2):70}
        self.assertEqual(single_quarter(data,2025,4),20)
        self.assertEqual(trailing_four_quarters(data,2026,2),105)
        self.assertEqual(trailing_four_quarters(data,2025,4),60)
        del data[(2025,2)]
        self.assertIsNone(trailing_four_quarters(data,2026,2))

    def test_negative_and_zero_cashflow_preserved(self):
        self.assertEqual(single_quarter({(2026,1):20,(2026,2):10},2026,2),-10)
        self.assertEqual(single_quarter({(2026,1):0},2026,1),0)
        self.assertIsNone(single_quarter({},2026,1))

    def test_monthly_sum_yoy_crosses_year(self):
        data={(2025,12):200,(2026,1):100,(2026,2):0,(2024,12):100,(2025,1):50,(2025,2):50}
        self.assertEqual(three_month_yoy(data,2026,2),.5)
        del data[(2025,2)]
        self.assertIsNone(three_month_yoy(data,2026,2))

    def test_zero_denominator_and_invalid_period(self):
        self.assertIsNone(three_month_yoy({(2026,m):10 for m in (1,2,3)},2026,3))
        with self.assertRaises(ValueError): trailing_four_quarters({},2026,5)
        with self.assertRaises(ValueError): three_month_yoy({},2026,0)
