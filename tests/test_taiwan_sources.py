import unittest
from moneytools.taiwan.official import number, roc_period, index, validate_rows, assemble

class TaiwanSourcesTests(unittest.TestCase):
    def test_missing_not_zero(self):
        for value in (None, '', '--', '－', 'NaN', 'Infinity', True, 'N/A'):
            self.assertIsNone(number(value))
        self.assertEqual(number('0'), 0)
        self.assertEqual(number('1,234.5'), 1234.5)
        self.assertEqual(number('(123)'), -123)

    def test_dates_do_not_use_fetch_date(self):
        self.assertEqual(roc_period('1150915'), '2026-09-15')
        self.assertEqual(roc_period('115/08', monthly=True), '2026-08')
        self.assertEqual(roc_period('2026-09-15'), '2026-09-15')
        for value in ('1150230', '1151301', '', '202609'):
            with self.assertRaises(ValueError): roc_period(value)

    def test_bad_payload_and_duplicates_rejected(self):
        for value in ({'error': 'rate limit'}, [], ['bad']):
            with self.assertRaises(ValueError): validate_rows(value)
        with self.assertRaises(ValueError): index([{'id': '1'}, {'id': '1'}], 'id')

    def datasets(self):
        return {
            'twse-companies': [{'公司代號':'2330','公司簡稱':'台積電','產業別':'24'}],
            'twse-quotes': [{'Code':'2330','Date':'1150915','ClosingPrice':'100','TradeVolume':'1,000','TradeValue':'100,000'}, {'Code':'0050','Date':'1150915'}],
            'twse-revenue': [{'公司代號':'2330','資料年月':'11508','營業收入-當月營收':'115','營業收入-去年當月營收':'100'}],
            'twse-income': [{'公司代號':'2330','年度':'115','季別':'2'}],
            'tpex-companies': [{'SecuritiesCompanyCode':'6488','CompanyAbbreviation':'環球晶'}],
            'tpex-quotes': [{'SecuritiesCompanyCode':'6488','Date':'1150915','Close':'--','TradingShares':'0','TransactionAmount':'0'}],
            'tpex-revenue': [{'公司代號':'6488','資料年月':'11508','營業收入-當月營收':'0','營業收入-去年當月營收':'0'}],
            'tpex-income': [{'SecuritiesCompanyCode':'6488','Year':'115','Season':'2'}],
        }

    def test_roster_join_excludes_etf_and_retains_market_identity(self):
        result = assemble(self.datasets(), {})
        self.assertEqual([x['id'] for x in result['stocks']], ['TWSE:2330','TPEX:6488'])
        self.assertEqual(result['coverage'], {'TWSE':1,'TPEX':1})
        self.assertIsNone(result['qualifyingCount'])
        self.assertTrue(all(x['qualification'] is None for x in result['stocks']))
        self.assertAlmostEqual(result['stocks'][0]['monthlyRevenue']['yoy'], .15)
        self.assertEqual(result['stocks'][0]['quote']['volumeShares'],1000)
        self.assertEqual(result['stocks'][0]['quote']['date'],'2026-09-15')
        self.assertIsNone(result['stocks'][1]['quote']['close'])
        self.assertIsNone(result['stocks'][1]['monthlyRevenue']['yoy'])

    def test_missing_company_quote_is_explicit(self):
        data=self.datasets();data['twse-quotes']=[{'Code':'0050','Date':'1150915'}]
        row=assemble(data,{})['stocks'][0]
        self.assertIsNone(row['quote'])
        self.assertIn('本次缺少行情',row['blockers'])
        self.assertEqual(row['status'],'INCOMPLETE')

if __name__ == '__main__': unittest.main()
