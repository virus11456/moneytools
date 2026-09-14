import contextlib
import importlib.util
import io
import json
import tempfile
import types
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

from moneytools.setup import analyze
from test_engine import record


class ScanEvidenceTests(unittest.TestCase):
    def test_daily_publish_keeps_reference_while_compacting_chart(self):
        source = record()
        result = analyze(source, today=date(2026, 9, 12))
        result['fetchedAt'] = '2026-09-12T00:00:00+00:00'
        reference = next(c.copy() for c in result['entry']['confirmation'] if c['key'] == 'reclaim')
        provider = types.ModuleType('moneytools.provider')
        provider.fetch_record = lambda symbol: source
        universe = types.ModuleType('update_universe')
        universe.refresh = lambda: {}
        spec = importlib.util.spec_from_file_location('scan_evidence_test', Path(__file__).parents[1] / 'scripts/scan.py')
        scan = importlib.util.module_from_spec(spec)
        with patch.dict('sys.modules', {'moneytools.provider': provider, 'update_universe': universe}):
            spec.loader.exec_module(scan)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'universe.json').write_text('["TEST"]')
            with patch.dict('os.environ', {'GITHUB_ACTIONS':'true','GITHUB_REPOSITORY':'virus11456/moneytools','GITHUB_EVENT_NAME':'workflow_dispatch','GITHUB_RUN_ID':'123','GITHUB_RUN_ATTEMPT':'1'}, clear=True), patch.object(scan, 'ROOT', root), patch.object(scan, 'analyze', return_value=result), patch.object(scan.time, 'sleep'), contextlib.redirect_stdout(io.StringIO()):
                scan.run()
            published = json.loads((root / 'public/data/daily.json').read_text())
            self.assertEqual(published['scanProvenance']['trigger'], 'manual')
            self.assertEqual(published['scanProvenance']['runId'], '123')
            self.assertLessEqual(published['scanProvenance']['startedAt'], published['generatedAt'])
            stock = published['stocks'][0]
            self.assertEqual(next(c for c in stock['entry']['confirmation'] if c['key'] == 'reclaim'), reference)
            self.assertEqual(stock['technical']['bars'][-2]['date'], reference['referenceDate'])
            self.assertNotIn('high', stock['technical']['bars'][-2])
            self.assertEqual(stock['status'], result['status'])
            self.assertEqual(stock['fetchedAt'], '2026-09-12T00:00:00+00:00')
            self.assertEqual(published['newOpportunities'], [])
            with patch.dict('os.environ', {'GITHUB_ACTIONS':'true','GITHUB_REPOSITORY':'virus11456/moneytools','GITHUB_EVENT_NAME':'schedule','GITHUB_RUN_ID':'456','GITHUB_RUN_ATTEMPT':'1'}, clear=True), patch.object(scan, 'ROOT', root), patch.object(scan, 'analyze', return_value=result), patch.object(scan.time, 'sleep'), contextlib.redirect_stdout(io.StringIO()):
                scan.run()
            current = json.loads((root / 'public/data/daily.json').read_text())
            archived = json.loads((root / 'public/data/previous.json').read_text())
            self.assertEqual(current['scanProvenance']['trigger'], 'scheduled')
            self.assertEqual(current['scanProvenance']['runId'], '456')
            self.assertEqual(archived['scanProvenance'], published['scanProvenance'])
            self.assertEqual(current['stocks'][0]['fetchedAt'], published['stocks'][0]['fetchedAt'])
            self.assertEqual(current['newOpportunities'], [])
