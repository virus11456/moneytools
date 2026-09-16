import importlib.util,unittest
from datetime import datetime,timezone
from pathlib import Path
spec=importlib.util.spec_from_file_location('twscan',Path(__file__).resolve().parents[1]/'deploy/vps/taiwan_scan.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ScheduleTests(unittest.TestCase):
 def test_window_and_idempotence(self):
  self.assertFalse(m.should_run(datetime(2026,9,16,7,30,tzinfo=timezone.utc)))
  self.assertTrue(m.should_run(datetime(2026,9,16,8,30,tzinfo=timezone.utc)))
  self.assertFalse(m.should_run(datetime(2026,9,16,8,30,tzinfo=timezone.utc),'2026-09-16'))
  self.assertFalse(m.should_run(datetime(2026,9,19,8,30,tzinfo=timezone.utc)))
