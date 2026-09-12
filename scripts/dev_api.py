from http.server import ThreadingHTTPServer
from urllib.parse import urlparse
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from api.analyze import handler as Analyze
from api.search import handler as Search
class Router(Analyze):
    def do_GET(self):
        if urlparse(self.path).path=='/api/search':return Search.do_GET(self)
        return super().do_GET()
ThreadingHTTPServer(('127.0.0.1',8788),Router).serve_forever()
