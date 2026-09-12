import unittest
from moneytools.recovery import collect_with_retries, reusable, retain_failed
from moneytools.setup import VERSION
class YFRateLimitError(Exception): pass

def item(symbol='AAA'):
    return dict(symbol=symbol,status='QUALITY',fetchedAt='2026-09-12T12:00:00+00:00',
        fundamentals={'passed':True,'checks':[{'status':'pass'}]},technical={'priceDate':'2026-09-11'})
def snap(items): return dict(methodVersion=VERSION,scanDate='2026-09-12',stocks=items)
class RecoveryTests(unittest.TestCase):
    def run_scan(self, symbols, fetch):
        self.sleeps=[]
        return collect_with_retries(symbols,fetch,self.sleeps.append,pacing=0,cooldowns=(45,90),log=lambda *a,**k:None)
    def test_rate_limit_pauses_entire_pass_then_recovers(self):
        calls=[]
        def fetch(s):
            calls.append((s,len(self.sleeps)))
            if len(calls)==1: raise YFRateLimitError()
            return item(s)
        stocks,errors,stats=self.run_scan(['AAA','BBB'],fetch)
        self.assertEqual([s['symbol'] for s in stocks],['AAA','BBB'])
        self.assertEqual(calls[:2],[('AAA',0),('AAA',1)])
        self.assertEqual(errors,[]);self.assertEqual(stats['recovered'],1);self.assertIn(45,self.sleeps)
    def test_persistent_limit_bounds_requests_and_marks_deferred(self):
        def fetch(s): raise YFRateLimitError()
        stocks,errors,stats=self.run_scan(['AAA','BBB'],fetch)
        self.assertEqual(stats['attempts'],3);self.assertEqual(errors[1]['attempts'],0)
        self.assertEqual(errors[1]['kind'],'DeferredAfterRateLimit');self.assertEqual(stocks,[])
    def test_only_failures_are_retried(self):
        calls=[]
        def fetch(s):
            calls.append(s)
            if s=='BBB' and calls.count(s)<2: raise TimeoutError()
            return item(s)
        stocks,errors,stats=self.run_scan(['AAA','BBB'],fetch)
        self.assertEqual(calls,['AAA','BBB','BBB']);self.assertEqual(stats['recovered'],1)
    def test_reuse_preserves_original_timestamp(self):
        s=item();out=reusable(snap([s]),['AAA'],'2026-09-12T14:00:00+00:00')
        self.assertEqual(out,[s]);self.assertIsNot(out[0],s)
    def test_new_session_never_reuses_earlier_session(self):
        s=item();s['fetchedAt']='2026-09-11T18:00:00+00:00';s['technical']['priceDate']='2026-09-10'
        prev=snap([s]);prev['scanDate']='2026-09-12'
        self.assertEqual(reusable(prev,['AAA'],'2026-09-11T21:00:00+00:00'),[])
    def test_old_or_missing_or_version_changed_not_reused(self):
        s=item();self.assertEqual(reusable(snap([s]),['AAA'],'2026-09-12T19:00:00+00:00'),[])
        s['fundamentals']['checks'][0]['status']='missing';self.assertEqual(reusable(snap([s]),['AAA'],'2026-09-12T14:00:00+00:00'),[])
        p=snap([item()]);p['methodVersion']='old';self.assertEqual(reusable(p,['AAA'],'2026-09-12T14:00:00+00:00'),[])
    def test_archive_restores_failed_symbol_without_updating_dates(self):
        original=item();retained=retain_failed(snap([]),snap([original]),[{'symbol':'AAA'}],['AAA'],'now')
        self.assertEqual(retained[0]['fetchedAt'],original['fetchedAt']);self.assertEqual(retained[0]['dataStatus'],'retained')
        self.assertNotIn('dataStatus',original)
    def test_repeated_failures_keep_original_observation(self):
        old=item();old['dataStatus']='retained';p=snap([]);p['retainedStocks']=[old]
        result=retain_failed(p,{},[{'symbol':'AAA'}],['AAA'],'later');self.assertEqual(result[0]['fetchedAt'],old['fetchedAt'])
    def test_success_and_removed_symbols_not_retained(self):
        self.assertEqual(retain_failed(snap([item()]),{},[],['AAA'],'now'),[])
        self.assertEqual(retain_failed(snap([item()]),{},[{'symbol':'AAA'}],[],'now'),[])
