from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse,parse_qs
from datetime import datetime
from zoneinfo import ZoneInfo
import json
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from moneytools.setup import analyze
from moneytools.provider import fetch_record, normalize_symbol, DataUnavailable

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            query=parse_qs(urlparse(self.path).query)
            force_refresh=query.get('refresh',[''])[0]=='1'
            symbol=normalize_symbol(query.get('symbol',[''])[0])
            record=fetch_record(symbol)
            body=analyze(record,today=datetime.now(ZoneInfo('America/New_York')).date()); code=200
        except ValueError as exc: body={'error':str(exc)}; code=400
        except DataUnavailable as exc: body={'error':str(exc)}; code=422
        except Exception: body={'error':'免費資料來源暫時無法回應。可先查看每日快照，稍後再試。'}; code=503
        self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8')
        if code==200 and not force_refresh: self.send_header('Cache-Control','public, s-maxage=3600, stale-while-revalidate=3600')
        else: self.send_header('Cache-Control','no-store')
        self.end_headers();self.wfile.write(json.dumps(body,ensure_ascii=False,allow_nan=False).encode())
