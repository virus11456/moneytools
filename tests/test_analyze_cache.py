import importlib.util
import io
import types
import unittest
from pathlib import Path
from unittest.mock import patch

class AnalyzeCacheTests(unittest.TestCase):
    def run_request(self,path, failure=False):
        provider=types.ModuleType('moneytools.provider')
        provider.normalize_symbol=lambda x:x
        provider.fetch_record=lambda x: {}
        provider.DataUnavailable=type('DataUnavailable',(Exception,),{})
        spec=importlib.util.spec_from_file_location('test_api_analyze',Path(__file__).parents[1]/'api/analyze.py')
        module=importlib.util.module_from_spec(spec)
        with patch.dict('sys.modules',{'moneytools.provider':provider}): spec.loader.exec_module(module)
        handler=object.__new__(module.handler);handler.path=path;handler.wfile=io.BytesIO()
        result={};handler.send_response=lambda code:result.update(code=code)
        handler.send_header=lambda key,value:result.update({key:value});handler.end_headers=lambda:None
        with patch.object(module,'analyze',side_effect=RuntimeError('failed') if failure else None,return_value={'status':'WAIT'}): handler.do_GET()
        return result
    def test_manual_refresh_not_shared_cached(self):
        self.assertEqual(self.run_request('/api/analyze?symbol=AAA&refresh=1')['Cache-Control'],'no-store')
    def test_default_query_keeps_cache(self):
        self.assertIn('s-maxage=3600',self.run_request('/api/analyze?symbol=AAA')['Cache-Control'])
    def test_failure_never_cached(self):
        result=self.run_request('/api/analyze?symbol=AAA',True)
        self.assertEqual(result['code'],503);self.assertEqual(result['Cache-Control'],'no-store')
