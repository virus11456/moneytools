import unittest
from datetime import datetime
from scripts.market_schedule import decision


class MarketScheduleTests(unittest.TestCase):
    def due(self, at, cron):
        return decision(datetime.fromisoformat(at), scheduled_cron=cron)[0]

    def test_summer_close(self):
        self.assertTrue(self.due('2026-09-14T21:15:00+00:00', '15 21 * * 1-5'))
        self.assertFalse(self.due('2026-09-14T22:15:00+00:00', '15 22 * * 1-5'))

    def test_winter_close(self):
        self.assertFalse(self.due('2026-01-06T21:15:00+00:00', '15 21 * * 1-5'))
        self.assertTrue(self.due('2026-01-06T22:15:00+00:00', '15 22 * * 1-5'))

    def test_dst_transition(self):
        self.assertTrue(self.due('2026-03-06T22:15:00+00:00', '15 22 * * 1-5'))
        self.assertTrue(self.due('2026-03-09T21:15:00+00:00', '15 21 * * 1-5'))

    def test_thanksgiving_early_close(self):
        self.assertTrue(self.due('2026-11-27T19:15:00+00:00', '15 19 * * 1-5'))
        self.assertFalse(self.due('2026-11-27T22:15:00+00:00', '15 22 * * 1-5'))

    def test_daylight_early_close(self):
        self.assertTrue(self.due('2025-07-03T18:15:00+00:00', '15 18 * * 1-5'))

    def test_holiday_and_weekend(self):
        for day in ['2026-11-26', '2026-12-25', '2026-09-13']:
            self.assertFalse(self.due(day + 'T22:15:00+00:00', '15 22 * * 1-5'))

    def test_delay_allowed_but_not_early(self):
        self.assertTrue(self.due('2026-09-14T22:05:00+00:00', '15 21 * * 1-5'))
        self.assertFalse(self.due('2026-09-14T21:10:00+00:00', '15 21 * * 1-5'))

    def test_manual_refresh_still_available(self):
        self.assertTrue(decision(datetime.fromisoformat('2026-09-13T12:00:00+00:00'), event='workflow_dispatch')[0])
