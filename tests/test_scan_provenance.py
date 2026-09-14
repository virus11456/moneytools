import unittest
from moneytools.scan_provenance import scan_provenance

class ScanProvenanceTests(unittest.TestCase):
    def test_workflow_trigger_and_attempt(self):
        for event, expected in [('schedule', 'scheduled'), ('workflow_dispatch', 'manual'), ('push', 'code_push'), ('other', 'unknown')]:
            with self.subTest(event=event):
                p=scan_provenance({'GITHUB_ACTIONS':'true','GITHUB_REPOSITORY':'virus11456/moneytools','GITHUB_EVENT_NAME':event,'GITHUB_RUN_ID':'123','GITHUB_RUN_ATTEMPT':'2'},'2026-09-14T02:00:00+00:00')
                self.assertEqual(p,{'trigger':expected,'startedAt':'2026-09-14T02:00:00+00:00','runId':'123','runAttempt':'2'})
    def test_local_or_missing_context_never_claims_scheduled(self):
        for env in [{}, {'GITHUB_EVENT_NAME':'schedule'}, {'GITHUB_ACTIONS':'false','GITHUB_EVENT_NAME':'schedule'}]:
            self.assertEqual(scan_provenance(env,'start'),{'trigger':'unknown','startedAt':'start'})
    def test_invalid_ids_not_published(self):
        for value in ['https://invalid.example','１２３','', '../123', '0', '01', '123\n', '9'*21]:
            p=scan_provenance({'GITHUB_ACTIONS':'true','GITHUB_REPOSITORY':'virus11456/moneytools','GITHUB_RUN_ID':value,'GITHUB_RUN_ATTEMPT':value},'start')
            self.assertNotIn('runId',p)
            self.assertNotIn('runAttempt',p)

    def test_other_repository_does_not_produce_moneytools_evidence(self):
        for repository in ['', 'virus11456/other']:
            p=scan_provenance({'GITHUB_ACTIONS':'true','GITHUB_REPOSITORY':repository,'GITHUB_EVENT_NAME':'schedule','GITHUB_RUN_ID':'123'},'start')
            self.assertEqual(p,{'trigger':'unknown','startedAt':'start'})
