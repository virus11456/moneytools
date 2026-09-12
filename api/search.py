from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse,parse_qs
import json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import yfinance as yf

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        q=parse_qs(urlparse(self.path).query).get('q',[''])[0].strip()
        code=200
        if not 1<=len(q)<=80: body={'error':'請輸入 1–80 字的公司名稱或股票代號'};code=400
        else:
            try:
                results=yf.Search(q,max_results=12,news_count=0,timeout=10).quotes
                body={'results':[{'symbol':r['symbol'],'name':r.get('longname',r.get('shortname',r['symbol'])),'exchange':r.get('exchange')} for r in results if r.get('quoteType')=='EQUITY' and r.get('exchange') in ('NMS','NGM','NCM','NYQ','ASE','PCX','BTS')]}
            except Exception: body={'error':'搜尋來源暫時無法使用，可輸入完整代號直接查詢'};code=503
        self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Cache-Control','public, s-maxage=3600' if code==200 else 'no-store');self.end_headers();self.wfile.write(json.dumps(body,ensure_ascii=False).encode())
