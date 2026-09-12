import unittest
from moneytools.state import transition
from moneytools.setup import VERSION

def stock(status='QUALITY',symbol='AAA',price_date='2026-09-10'):
    return dict(symbol=symbol,status=status,technical={'priceDate':price_date},financials={'fiscalDate':'2026-06-30'},reasons=['rule passed'])
def snap(stocks,previous=None,at='2026-09-11T00:00:00+00:00',errors=None):
    return dict(generatedAt=at,methodVersion=VERSION,**transition(previous,stocks,errors or [],at))
class StateTests(unittest.TestCase):
    def test_first_scan_is_baseline(self):
        s=snap([stock()]);self.assertTrue(s['baseline']);self.assertEqual(s['newOpportunities'],[])
    def test_transition_from_wait_is_new_and_persisted(self):
        old=snap([stock('WAIT')]);s=snap([stock('READY',price_date='2026-09-11')],old,'2026-09-12T00:00:00+00:00')
        self.assertEqual(s['newOpportunities'][0]['previousStatus'],'WAIT')
        self.assertEqual(s['lastObserved']['AAA']['status'],'READY')
    def test_unchanged_and_weekend_not_new(self):
        old=snap([stock()]);s=snap([stock()],old,'2026-09-12T00:00:00+00:00');self.assertEqual(s['newOpportunities'],[])
    def test_same_day_rerun_keeps_events(self):
        old=snap([stock('WAIT')]);s=snap([stock(price_date='2026-09-11')],old,'2026-09-12T00:00:00+00:00');again=snap([stock(price_date='2026-09-11')],s,'2026-09-12T01:00:00+00:00');self.assertEqual(s['newOpportunities'],again['newOpportunities'])
        next_day=snap([stock(price_date='2026-09-11')],again,'2026-09-13T01:00:00+00:00');self.assertEqual(next_day['newOpportunities'],[])
    def test_failure_and_recovery_do_not_reset_state(self):
        old=snap([stock()]);failed=snap([],old,errors=[{'symbol':'AAA'}]);recovered=snap([stock(price_date='2026-09-11')],failed,'2026-09-12T00:00:00+00:00');self.assertEqual(recovered['newOpportunities'],[])
    def test_missing_fundamentals_preserve_last_observed(self):
        old=snap([stock()]);s=snap([stock('INCOMPLETE')],old);self.assertEqual(s['lastObserved'],old['lastObserved'])
    def test_new_symbol_does_not_create_false_transition(self):
        old=snap([stock()]);s=snap([stock(),stock(symbol='BBB')],old);self.assertEqual(s['newOpportunities'],[])
    def test_rule_version_change_rebaselines(self):
        old=snap([stock('WAIT')]);old['methodVersion']='old';s=snap([stock('READY',price_date='2026-09-11')],old);self.assertTrue(s['baseline']);self.assertEqual(s['newOpportunities'],[])
    def test_no_change_without_new_market_or_fiscal_data(self):
        old=snap([stock('WAIT')]);s=snap([stock('READY')],old);self.assertEqual(s['newOpportunities'],[])
    def test_taipei_day_boundary(self):
        s=snap([stock()],at='2026-09-11T23:15:00+00:00');self.assertEqual(s['scanDate'],'2026-09-12')
