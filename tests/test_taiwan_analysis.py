import copy,json,tempfile,unittest
from datetime import date,timedelta,datetime,timezone
from pathlib import Path
from moneytools.taiwan.financials import parse_report,metrics,verify_latest
from moneytools.taiwan.analysis import analyze
from moneytools.taiwan.publish import build,publish

class TaiwanTests(unittest.TestCase):
 def setUp(self):
  self.day=date(2026,9,16)
  self.s={'id':'TWSE:2330','symbol':'2330','name':'公司甲','market':'TWSE','industryCode':'24','quote':{'close':399,'date':'2026-09-15'},'monthlyRevenue':None}
  self.f={'financials':{'revenue':1e9,'previousRevenue':8e8,'growth':.25,'operatingIncome':1e8,'operatingCashflow':1e8,'freeCashflow':1,'currency':'TWD','period':'2026Q2','basis':'合併'}}
  self.h={'bars':[{'date':(date(2026,9,15)-timedelta(days=299-i)).isoformat(),'close':100+i,'rawClose':100+i,'low':99+i,'high':101+i,'volume':1000000,'turnover':(100+i)*1000000} for i in range(300)]}
 def test_unit_identity_and_missing(self):
  h=(Path(__file__).parent/'fixtures/taiwan/report.html').read_text(); r=parse_report(h,['2330','2303'],2026,2)
  self.assertEqual(r['2330']['accounts']['取得不動產、廠房及設備'],-25000)
  self.assertIsNone(r['2303']['accounts']['取得不動產、廠房及設備']);self.assertEqual(r['2303']['accounts']['營業活動之淨現金流入（流出）'],0)
  for bad in [h.replace('新台幣仟元','美元'),h.replace('2026Q2','2026Q1'),h.replace('2303 公司乙','9999 公司乙')]:
   with self.assertRaises(ValueError):parse_report(bad,['2330','2303'],2026,2)
 def test_ttm_cross_year_and_basis(self):
  rs={}
  for y,q,rev in [(2026,2,60),(2025,4,100),(2025,2,40),(2024,4,80),(2024,2,30)]:
   for kind in ('IncomeStatement','CashflowStatement'):
    rs[(y,q,kind)]={'basis':'合併','accounts':{'營業收入合計':rev,'營業利益（損失）':rev/10,'營業活動之淨現金流入（流出）':rev/5,'取得不動產、廠房及設備':-rev/10}}
  f=metrics(rs,2026,2);self.assertEqual(f['revenue'],120);self.assertEqual(f['previousRevenue'],90);self.assertAlmostEqual(f['freeCashflow'],12)
  rs[(2025,4,'CashflowStatement')]['basis']='個別';self.assertIsNone(metrics(rs,2026,2)['revenue'])
 def test_two_groups_and_strict_zero(self):
  r=analyze(self.s,self.f,self.h,self.day);self.assertEqual(r['status'],'DUAL')
  self.assertEqual(analyze(self.s,self.f,None,self.day)['status'],'FUNDAMENTAL')
  for key in ['operatingIncome','operatingCashflow','freeCashflow']:
   f=copy.deepcopy(self.f);f['financials'][key]=0;self.assertFalse(analyze(self.s,f,self.h,self.day)['fundamentals']['passed'])
  f=copy.deepcopy(self.f);f['financials']['freeCashflow']=None;self.assertEqual(analyze(self.s,f,self.h,self.day)['status'],'INCOMPLETE')
 def test_official_industry_codes(self):
  for industry in ('14','17'):
   stock={**self.s,'industryCode':industry}
   self.assertFalse(analyze(stock,self.f,self.h,self.day)['fundamentals']['passed'])
  tourism={**self.s,'industryCode':'16'}
  self.assertTrue(analyze(tourism,self.f,self.h,self.day)['fundamentals']['passed'])
 def test_exact_thresholds(self):
  f=copy.deepcopy(self.f);f['financials']['growth']=.15;f['financials']['previousRevenue']=f['financials']['revenue']/1.15;self.assertTrue(analyze(self.s,f,self.h,self.day)['fundamentals']['passed'])
  f['financials']['growth']=.14999;f['financials']['previousRevenue']=f['financials']['revenue']/1.14999;self.assertFalse(analyze(self.s,f,self.h,self.day)['fundamentals']['passed'])
 def test_official_match_stale_and_short(self):
  h=copy.deepcopy(self.h);h['bars'][-1]['rawClose']=380;self.assertFalse(analyze(self.s,self.f,h,self.day)['dualPass'])
  self.assertFalse(analyze(self.s,self.f,self.h,date(2026,9,22))['dualPass'])
  h['bars']=h['bars'][-219:];self.assertFalse(analyze(self.s,self.f,h,self.day)['dualPass'])
 def test_baseline_today_and_retention(self):
  audit={'stocks':[self.s],'coverage':{'TWSE':1},'sources':{}};now=datetime(2026,9,16,tzinfo=timezone.utc)
  initial=copy.deepcopy(self.f);initial['financials']['growth']=.10;initial['financials']['previousRevenue']=initial['financials']['revenue']/1.1
  first=build(audit,{'2330':initial},{},now=now);self.assertFalse(first['stocks'][0]['today'])
  second=build(audit,{'2330':self.f},{self.s['id']:self.h},first,now);self.assertTrue(second['stocks'][0]['today'])
  third=build(audit,{'2330':self.f},{self.s['id']:self.h},second,now);self.assertTrue(third['stocks'][0]['today'])
  nextday=build(audit,{'2330':self.f},{self.s['id']:self.h},third,now+timedelta(days=1));self.assertFalse(nextday['stocks'][0]['today'])
  with tempfile.TemporaryDirectory() as tmp:
   for _ in range(5):publish(second,tmp)
   self.assertEqual(len(list(Path(tmp).glob('release-*'))),3)
   self.assertEqual(len(json.loads((Path(tmp)/'current/history.json').read_text())),1)
   self.assertEqual(json.loads((Path(tmp)/'current/stocks/2330.json').read_text())['symbol'],'2330')
   summary=json.loads((Path(tmp)/'current/dashboard.json').read_text())['stocks'][0]
   self.assertNotIn('financialSources',summary);self.assertNotIn('bars',summary['technical'])
   self.assertEqual(summary['fundamentals']['passed'],second['stocks'][0]['fundamentals']['passed'])

class CrossCheckTests(unittest.TestCase):
 def test_current_period_exchange_confirmation(self):
  s={'symbol':'2330','id':'TWSE:2330','incomePeriodRaw':{'year':'115','quarter':'2','revenueSourceValue':100,'operatingIncomeSourceValue':10}}
  import urllib.parse
  capture={'url':'https://mopsfin.twse.com.tw/compare/report?compareItem=IncomeStatement','records':{'2330':{'year':2026,'quarter':2,'accounts':{}}}}
  capture['records']['2330']['accounts']={'\u71df\u696d\u6536\u5165\u5408\u8a08':100000,'\u71df\u696d\u5229\u76ca\uff08\u640d\u5931\uff09':10000}
  f={'2330':{'financials':{'revenue':123}}}
  valid,bad=verify_latest({'stocks':[s]},f,[capture]);self.assertEqual(valid,f);self.assertEqual(bad,[])
  s['incomePeriodRaw']['operatingIncomeSourceValue']=11
  valid,bad=verify_latest({'stocks':[s]},f,[capture]);self.assertEqual(valid,{});self.assertEqual(bad,['TWSE:2330'])

 def test_latest_capture_wins_over_archive_order(self):
  s={'symbol':'2330','id':'TWSE:2330','incomePeriodRaw':{'year':'115','quarter':'2','revenueSourceValue':100,'operatingIncomeSourceValue':10}}
  old={'url':'https://mopsfin.twse.com.tw/compare/report?compareItem=IncomeStatement','retrievedAt':'2026-09-15T00:00:00Z','records':{'2330':{'year':2026,'quarter':2,'accounts':{'營業收入合計':99000,'營業利益（損失）':10000}}}}
  new=copy.deepcopy(old);new['retrievedAt']='2026-09-16T00:00:00Z';new['records']['2330']['accounts']['營業收入合計']=100000
  f={'2330':{'financials':{'revenue':123}}}
  self.assertEqual(verify_latest({'stocks':[s]},f,[new,old]),(f,[]))

class PublicationGuardTests(unittest.TestCase):
 def test_old_histories_do_not_count_as_current_coverage(self):
  import importlib.util
  from unittest.mock import patch
  spec=importlib.util.spec_from_file_location('tw_build',Path(__file__).parents[1]/'scripts/taiwan_build.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
  with tempfile.TemporaryDirectory() as tmp:
   data=Path(tmp)/'private';public=Path(tmp)/'public'
   (data/'live').mkdir(parents=True);(data/'financials').mkdir();(public/'current').mkdir(parents=True)
   (data/'live/source-audit.json').write_text(json.dumps({'stocks':[]}))
   (data/'financials/financials.json').write_text(json.dumps({'complete':True,'companies':{}}))
   (public/'current/dashboard.json').write_text('{"previous":"preserved"}')
   snapshot={'stocks':[{'technical':{'valid':False}}],'financialCount':1,'historyCount':1}
   with patch.object(mod,'build',return_value=snapshot):
    with self.assertRaisesRegex(ValueError,'coverage'):mod.run(data,public)
   self.assertEqual((public/'current/dashboard.json').read_text(),'{"previous":"preserved"}')
