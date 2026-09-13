import unittest
from copy import deepcopy
from moneytools.verified_financials import supplement, REVIEWED

class VerifiedFinancialsTests(unittest.TestCase):
    def record(self):
        return dict(symbol='LII',financialCurrency='USD',fetchedAt='2026-09-13T03:00:00+00:00',source='Yahoo Finance / yfinance',financials=dict(fiscalDate='2025-12-31',operatingCashflow=None,revenue=5_195_300_000,capitalExpenditure=-118_800_000))
    def test_exact_period_missing_only_and_provenance(self):
        r=self.record(); original=deepcopy(r);out=supplement(r)
        self.assertEqual(out['financials']['operatingCashflow'],757_600_000)
        self.assertEqual(out['financialSupplements'][0]['sourceUrl'],REVIEWED[0]['sourceUrl'])
        self.assertEqual(r,original)
    def test_never_overwrite_including_zero(self):
        for v in [0,100,-100]:
            r=self.record();r['financials']['operatingCashflow']=v
            self.assertEqual(supplement(r),r)
    def test_wrong_identity_currency_or_period(self):
        for field,value in [('symbol','OTHER'),('financialCurrency','EUR'),('fetchedAt','2026-09-12T03:00:00Z')]:
            r=self.record();r[field]=value;self.assertEqual(supplement(r),r)
        r=self.record();r['financials']['fiscalDate']='2026-12-31';self.assertEqual(supplement(r),r)
    def test_restated_or_missing_anchor_requires_review(self):
        for v in [None,5_195_000_000]:
            r=self.record();r['financials']['revenue']=v;self.assertEqual(supplement(r),r)
    def test_absent_fetch_date_not_applied(self):
        r=self.record();del r['fetchedAt'];self.assertEqual(supplement(r),r)

    def test_airbnb_cashflow_matches_filing_reconciliation(self):
        r=dict(symbol='ABNB',financialCurrency='USD',fetchedAt='2026-09-13T03:00:00Z',financials=dict(fiscalDate='2025-12-31',revenue=12_241_000_000,operatingCashflow=4_646_000_000,capitalExpenditure=None))
        out=supplement(r);f=out['financials']
        self.assertEqual(f['capitalExpenditure'],-33_000_000)
        self.assertEqual(f['operatingCashflow']-abs(f['capitalExpenditure']),4_613_000_000)
    def test_humana_uses_consolidated_not_segment_profit(self):
        r=dict(symbol='HUM',financialCurrency='USD',fetchedAt='2026-09-13T03:00:00Z',financials=dict(fiscalDate='2025-12-31',revenue=129_664_000_000,operatingCashflow=921_000_000,operatingIncome=None))
        self.assertEqual(supplement(r)['financials']['operatingIncome'],2_704_000_000)
    def test_all_supplements_expire_on_new_fiscal_period(self):
        for entry in REVIEWED:
            r=dict(symbol=entry['symbol'],financialCurrency='USD',fetchedAt='2027-09-13T00:00:00Z',financials=dict(entry['anchors'],fiscalDate='2026-12-31'))
            self.assertEqual(supplement(r),r)
