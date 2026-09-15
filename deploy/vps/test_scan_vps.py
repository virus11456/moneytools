import unittest
from datetime import datetime, timezone
from scan_vps import due_session
class ScheduleTests(unittest.TestCase):
    def d(self,s,completed=''):
        return due_session(datetime.fromisoformat(s).replace(tzinfo=timezone.utc),completed)
    def test_before_close(self): self.assertIsNone(self.d('2026-09-15T21:14:59','2026-09-14'))
    def test_due(self): self.assertEqual(self.d('2026-09-15T21:15:00','2026-09-14'),'2026-09-15')
    def test_duplicate(self): self.assertIsNone(self.d('2026-09-15T22:00:00','2026-09-15'))
    def test_weekend(self): self.assertIsNone(self.d('2026-09-13T21:15:00','2026-09-11'))
    def test_early_close(self): self.assertEqual(self.d('2026-11-27T19:15:00','2026-11-25'),'2026-11-27')
    def test_winter(self): self.assertEqual(self.d('2026-12-01T22:15:00','2026-11-30'),'2026-12-01')
if __name__=='__main__': unittest.main()
