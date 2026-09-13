import unittest
from moneytools.history import append_history
from moneytools.setup import VERSION
from test_daily_changes import stock, scan

class HistoryTests(unittest.TestCase):
    def test_baseline_no_invented_entry(self):
        h=append_history({}, {}, [stock()], [], '2026-09-11T00:00:00+00:00')
        self.assertEqual(h['events'],[])
        self.assertEqual(h['days'][0]['observed'],['AAA'])

    def test_repeated_scan_does_not_duplicate(self):
        prior=scan([stock()]);current=stock(dual=True,price='2026-09-11')
        h=append_history({},prior,[current],[],'2026-09-12T00:00:00+00:00')
        again=append_history(h,scan([current],prior),[current],[],'2026-09-12T01:00:00+00:00')
        self.assertEqual(len(again['events']),1)
        self.assertEqual(len(again['days']),1)

    def test_reversal_is_recorded_and_missing_is_not_exit(self):
        prior=scan([stock()]);up=stock(dual=True,price='2026-09-11')
        h=append_history({},prior,[up],[],'2026-09-12T00:00:00+00:00')
        down=stock(price='2026-09-12')
        h=append_history(h,scan([up]),[down],[],'2026-09-12T01:00:00+00:00')
        self.assertEqual([e['kinds'] for e in h['events']],[['DUAL_ADDED'],['DUAL_LOST']])
        h=append_history(h,scan([down]),[],[{'symbol':'AAA'}],'2026-09-12T02:00:00+00:00')
        self.assertEqual(len(h['events']),2)
        self.assertEqual(h['days'][0]['unavailable'],['AAA'])

    def test_retention_and_method_reset(self):
        h=append_history({}, {}, [stock()], [], '2026-08-01T00:00:00+00:00')
        h=append_history(h,scan([stock()]),[stock()],[],'2026-09-12T00:00:00+00:00')
        self.assertEqual(len(h['days']),1)
        h['methodVersion']='old'
        reset=append_history(h,{},[stock()],[],'2026-09-13T00:00:00+00:00')
        self.assertEqual(reset['events'],[])
        self.assertEqual(reset['startedAt'],'2026-09-13T00:00:00+00:00')
