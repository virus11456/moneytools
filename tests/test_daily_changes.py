import unittest
from moneytools.state import daily_changes
from moneytools.setup import VERSION

def stock(f=True, dual=False, status='QUALITY', price='2026-09-10', symbol='AAA'):
    return dict(symbol=symbol,status=status,fundamentals={'passed':f},dualPass=dual,
                technical={'priceDate':price},financials={'fiscalDate':'2026-06-30'},reasons=['explicit gates'])
def scan(stocks, previous=None, at='2026-09-11T00:00:00+00:00', errors=None):
    from datetime import datetime
    from zoneinfo import ZoneInfo
    return dict(stocks=stocks, methodVersion=VERSION, scanDate=datetime.fromisoformat(at).astimezone(ZoneInfo('Asia/Taipei')).date().isoformat(),
                **daily_changes(previous, stocks, errors or [], at))
class DailyChangesTests(unittest.TestCase):
    def test_added_universe_is_baseline(self):
        s=scan([stock(),stock(symbol='BBB')]);self.assertEqual(s['dailyChanges'],[]);self.assertEqual(len(s['changeBaselineSymbols']),2)
    def test_upgrade_even_when_quality_status_is_unchanged(self):
        before=scan([stock()]);after=scan([stock(dual=True,price='2026-09-11')],before,'2026-09-12T00:00:00+00:00')
        self.assertEqual(after['dailyChanges'][0]['kinds'],['DUAL_ADDED'])
    def test_new_fundamental_and_dual(self):
        before=scan([stock(f=False,status='WAIT')]);after=scan([stock(dual=True,price='2026-09-11')],before)
        self.assertEqual(after['dailyChanges'][0]['kinds'],['FUNDAMENTAL_ADDED','DUAL_ADDED'])
    def test_exit_is_visible(self):
        before=scan([stock(dual=True)]);after=scan([stock(f=False,status='WAIT',price='2026-09-11')],before)
        self.assertEqual(after['dailyChanges'][0]['kinds'],['FUNDAMENTAL_LOST'])
    def test_missing_data_does_not_emit_exit_or_reset(self):
        before=scan([stock(dual=True)]);after=scan([stock(f=False,status='INCOMPLETE',price='2026-09-11')],before)
        self.assertEqual(after['dailyChanges'],[]);self.assertEqual(after['gateObserved'],before['gateObserved'])
    def test_same_day_preserved_next_day_cleared(self):
        before=scan([stock()]);after=scan([stock(dual=True,price='2026-09-11')],before)
        same=scan(after['stocks'],after);self.assertEqual(same['dailyChanges'],after['dailyChanges'])
        tomorrow=scan(after['stocks'],same,'2026-09-12T00:00:00+00:00');self.assertEqual(tomorrow['dailyChanges'],[])
    def test_price_must_advance(self):
        before=scan([stock()]);after=scan([stock(dual=True)],before);self.assertEqual(after['dailyChanges'],[])
    def test_previous_snapshot_migration_and_failure_recovery(self):
        before=dict(methodVersion=VERSION,stocks=[stock()],scanDate='2026-09-11')
        failed=scan([],before,errors=[{'symbol':'AAA'}]);after=scan([stock(dual=True,price='2026-09-11')],failed)
        self.assertEqual(after['dailyChanges'][0]['kinds'],['DUAL_ADDED'])
    def test_entry_change_is_separate(self):
        before=scan([stock(dual=True,status='APPROACHING')]);after=scan([stock(dual=True,status='READY',price='2026-09-11')],before)
        self.assertEqual(after['dailyChanges'][0]['kinds'],['ENTRY_CHANGED'])
    def test_method_change_rebaselines(self):
        before=scan([stock()]);before['methodVersion']='old';after=scan([stock(dual=True,price='2026-09-11')],before)
        self.assertEqual(after['dailyChanges'],[])
