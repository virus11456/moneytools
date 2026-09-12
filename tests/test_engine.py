import unittest
from datetime import date,timedelta
from moneytools.setup import analyze

def record():
    end=date(2026,9,11)
    bars=[dict(date=(end-timedelta(days=251-i)).isoformat(),close=80+i*.1,high=80+i*.1+.8,low=80+i*.1-.8,volume=2_000_000) for i in range(252)]
    return dict(symbol='TEST',financialCurrency='USD',sector='Technology',bars=bars,financials=dict(revenue=200e6,previousRevenue=150e6,operatingIncome=20e6,operatingCashflow=25e6,capitalExpenditure=-5e6,fiscalDate='2025-12-31'))
class EngineTests(unittest.TestCase):
    def test_quality_is_not_automatic_ready(self):
        s=analyze(record(),today=date(2026,9,12));self.assertTrue(s['fundamentals']['passed']);self.assertTrue(s['technical']['passed']);self.assertNotEqual(s['status'],'READY')
        self.assertEqual(s['financials']['freeCashflow'],20e6)
    def test_missing_cashflow_cannot_qualify(self):
        r=record();del r['financials']['operatingCashflow'];s=analyze(r,today=date(2026,9,12));self.assertEqual(s['status'],'INCOMPLETE')
    def test_stale_price_cannot_qualify(self):
        s=analyze(record(),today=date(2026,10,1));self.assertEqual(s['status'],'INCOMPLETE')
    def test_bad_fundamentals_wait(self):
        r=record();r['financials']['previousRevenue']=210e6;s=analyze(r,today=date(2026,9,12));self.assertEqual(s['status'],'WAIT')
    def test_non_usd_not_applied_without_conversion(self):
        r=record();r['financialCurrency']='EUR';self.assertEqual(analyze(r,today=date(2026,9,12))['status'],'INCOMPLETE')
    def test_not_enough_bars(self):
        r=record();r['bars']=r['bars'][-50:];self.assertEqual(analyze(r,today=date(2026,9,12))['status'],'INCOMPLETE')
    def test_zero_volume_never_divides_by_zero(self):
        r=record()
        for b in r['bars']:b['volume']=0
        s=analyze(r,today=date(2026,9,12));self.assertNotEqual(s['status'],'READY');self.assertIsNone(s['entry']['riskReward'])
    def test_invalidation_is_below_zone(self):
        s=analyze(record(),today=date(2026,9,12));self.assertLess(s['entry']['invalidation'],s['entry']['zoneLow'])
