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

    def test_intraday_entry_upgrade_preserves_today_gate(self):
        before=scan([stock()]);added=scan([stock(dual=True,status='APPROACHING',price='2026-09-11')],before)
        upgraded=scan([stock(dual=True,status='READY',price='2026-09-12')],added)
        self.assertIn('DUAL_ADDED',upgraded['dailyChanges'][0]['kinds'])

class ConditionChangeTests(unittest.TestCase):
    def checked(self, passed, price, value=1):
        s=stock(price=price)
        s['technical']['checks']=[dict(key='alignment',label='均線多頭排列',status='pass' if passed else 'fail',value=value,detail='收盤價 > MA50 > MA200')]
        return s

    def test_condition_change_without_group_change(self):
        before=scan([self.checked(False,'2026-09-10',10)])
        after=scan([self.checked(True,'2026-09-11',12)],before)
        event=after['dailyChanges'][0]
        self.assertEqual(event['kinds'],['CONDITIONS_CHANGED'])
        self.assertEqual(event['conditionChanges'][0]['before']['value'],10)
        self.assertEqual(event['conditionChanges'][0]['after']['value'],12)

    def test_missing_is_not_a_failed_condition(self):
        s=self.checked(False,'2026-09-10');s['technical']['checks'][0]['status']='missing'
        before=scan([s]);after=scan([self.checked(True,'2026-09-11')],before)
        self.assertEqual(after['dailyChanges'],[])

    def test_legacy_gate_without_checks_does_not_invent_delta(self):
        before=scan([self.checked(False,'2026-09-10')]);before['gateObserved']['AAA'].pop('checks')
        after=scan([self.checked(True,'2026-09-11')],before)
        self.assertEqual(after['dailyChanges'],[])

    def test_reverted_condition_clears_same_day_event(self):
        before=scan([self.checked(False,'2026-09-09')])
        after=scan([self.checked(True,'2026-09-10')],before)
        reverted=scan([self.checked(False,'2026-09-11')],after)
        self.assertEqual(reverted['dailyChanges'],[])
