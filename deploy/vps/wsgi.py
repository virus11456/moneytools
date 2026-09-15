"""WSGI transport for the existing analysis handlers; no qualification rules change."""
import io
import json
from http import HTTPStatus
from api.analyze import handler as Analyze
from api.search import handler as Search

class Response:
    def __init__(self, path):
        self.path = path
        self.wfile = io.BytesIO()
        self.code = 200
        self.headers = []
    def send_response(self, code):
        self.code = code
    def send_header(self, name, value):
        self.headers.append((name, value))
    def end_headers(self):
        pass

def application(environ, start_response):
    path = environ.get('PATH_INFO', '')
    response = Response(path + '?' + environ.get('QUERY_STRING', ''))
    if environ.get('REQUEST_METHOD') not in ('GET', 'HEAD'):
        response.code = 405
        response.headers.append(('Allow', 'GET, HEAD'))
        body = b'{"error":"Method not allowed"}'
    elif path == '/api/health':
        body = b'{"ok":true,"service":"moneytools"}'
    elif path in ('/api/analyze', '/api/search'):
        target = Analyze if path == '/api/analyze' else Search
        target.do_GET(response)
        body = response.wfile.getvalue()
    else:
        response.code = 404
        body = b'{"error":"Not found"}'
    if not any(k.lower() == 'content-type' for k, _ in response.headers):
        response.headers.append(('Content-Type', 'application/json; charset=utf-8'))
    response.headers.append(('Content-Length', str(len(body))))
    start_response(f'{response.code} {HTTPStatus(response.code).phrase}', response.headers)
    return [b'' if environ.get('REQUEST_METHOD') == 'HEAD' else body]
