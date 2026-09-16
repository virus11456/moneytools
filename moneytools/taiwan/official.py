"""Official-source discovery snapshots. No qualification claims until gates are ready."""
import hashlib
import json
import math
import re
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

SOURCES = {
    'twse-companies': 'https://openapi.twse.com.tw/v1/opendata/t187ap03_L',
    'twse-quotes': 'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL',
    'twse-revenue': 'https://openapi.twse.com.tw/v1/opendata/t187ap05_L',
    'twse-income': 'https://openapi.twse.com.tw/v1/opendata/t187ap06_L_ci',
    'tpex-companies': 'https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap03_O',
    'tpex-quotes': 'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes',
    'tpex-revenue': 'https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap05_O',
    'tpex-income': 'https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap06_O_ci',
}


def number(value):
    """Missing, nonfinite and unrecognised numeric syntax stay missing, never zero."""
    if value is None or isinstance(value, bool):
        return None
    s = str(value).strip().replace(',', '')
    if s.startswith('(') and s.endswith(')'):
        s = '-' + s[1:-1]
    if not re.fullmatch(r'[+-]?\d+(?:\.\d+)?', s):
        return None
    n = float(s)
    return n if math.isfinite(n) else None


def roc_period(value, monthly=False):
    s = re.sub(r'[/\-]', '', str(value).strip())
    expected = (5, 6) if monthly else (7, 8)
    if not s.isdigit() or len(s) not in expected:
        raise ValueError('Invalid ROC/Gregorian period: ' + s)
    year_digits = len(s) - (2 if monthly else 4)
    year = int(s[:year_digits]) + (1911 if year_digits == 3 else 0)
    month = int(s[year_digits:year_digits + 2])
    day = 1 if monthly else int(s[-2:])
    result = date(year, month, day).isoformat()
    return result[:7] if monthly else result


def index(rows, field):
    result = {}
    for row in rows:
        key = str(row.get(field, '')).strip()
        if not key or key in result:
            raise ValueError('Missing or duplicate identifier: ' + key)
        result[key] = row
    return result


def validate_rows(rows):
    if not isinstance(rows, list) or not rows or not all(isinstance(r, dict) for r in rows):
        raise ValueError('Expected nonempty official JSON row array')
    return rows


def download(name, directory):
    """Save immutable successful captures; failed fetches never overwrite prior data."""
    request = Request(SOURCES[name], headers={'Accept': 'application/json', 'User-Agent': 'Moneytools/0.1'})
    with urlopen(request, timeout=30) as response:
        raw = response.read(20_000_001)
    if len(raw) > 20_000_000:
        raise ValueError('Unexpectedly large response')
    validate_rows(json.loads(raw))
    digest = hashlib.sha256(raw).hexdigest()
    root = Path(directory); root.mkdir(parents=True, exist_ok=True)
    archive = root / (name + '-' + digest + '.json')
    if not archive.exists():
        temp = archive.with_suffix('.tmp'); temp.write_bytes(raw); temp.replace(archive)
    return {'url': SOURCES[name], 'retrievedAt': datetime.now(timezone.utc).isoformat(),
            'sha256': digest, 'file': archive.name}


def assemble(datasets, provenance):
    records = []
    for market in ('twse', 'tpex'):
        listed = market == 'twse'
        company_id = '公司代號' if listed else 'SecuritiesCompanyCode'
        companies = index(validate_rows(datasets[market + '-companies']), company_id)
        quotes = index(validate_rows(datasets[market + '-quotes']), 'Code' if listed else company_id)
        revenue = index(validate_rows(datasets[market + '-revenue']), '公司代號')
        income = index(validate_rows(datasets[market + '-income']), company_id)
        for symbol, company in companies.items():
            # Only ordinary four-digit company identifiers; never infer universe from quotes.
            if not re.fullmatch(r'[1-9]\d{3}', symbol):
                continue
            q = quotes.get(symbol); r = revenue.get(symbol); f = income.get(symbol)
            quote = None
            if q:
                fields = ('ClosingPrice', 'HighestPrice', 'LowestPrice', 'TradeVolume', 'TradeValue') if listed else ('Close', 'High', 'Low', 'TradingShares', 'TransactionAmount')
                quote = dict(zip(('close', 'high', 'low', 'volumeShares', 'turnoverTWD'), (number(q.get(k)) for k in fields)))
                quote.update(date=roc_period(q['Date']), priceBasis='unadjusted', currency='TWD')
            monthly = None
            if r:
                current = number(r.get('營業收入-當月營收')); prior = number(r.get('營業收入-去年當月營收'))
                monthly = {'period': roc_period(r['資料年月'], monthly=True), 'sourceValue': current,
                           'previousYearSourceValue': prior,
                           'yoy': current / prior - 1 if current is not None and prior is not None and prior > 0 else None,
                           'reportedYoyPercent': number(r.get('營業收入-去年同月增減(%)')),
                           'unitStatus': 'pending-source-unit-verification', 'note': r.get('備註')}
            blockers = ['歷史日線與除權息調整待接入', '近四季財報與現金流待核對', '台股篩選門檻待驗證']
            if quote is None: blockers.append('本次缺少行情')
            if monthly is None: blockers.append('本次缺少月營收')
            if f is None: blockers.append('一般業損益彙總未涵蓋，需另查財報口徑')
            records.append({'id': market.upper() + ':' + symbol, 'market': market.upper(), 'symbol': symbol,
                            'name': company.get('公司簡稱' if listed else 'CompanyAbbreviation'),
                            'industryCode': company.get('產業別' if listed else 'SecuritiesIndustryCode'),
                            'quote': quote, 'monthlyRevenue': monthly,
                            'incomePeriodRaw': {'year': f.get('年度' if listed else 'Year'), 'quarter': f.get('季別' if listed else 'Season'), 'revenueSourceValue': number(f.get('營業收入')), 'operatingIncomeSourceValue': number(f.get('營業利益（損失）'))} if f else None,
                            'status': 'INCOMPLETE', 'qualification': None, 'blockers': blockers,
                            'sourceKeys': [market + '-' + k for k in ('companies', 'quotes', 'revenue', 'income')]})
    return {'market': 'TW', 'stage': 'source-validation', 'generatedAt': datetime.now(timezone.utc).isoformat(),
            'sources': provenance, 'stocks': records,
            'coverage': {m: sum(s['market'] == m for s in records) for m in ('TWSE', 'TPEX')},
            'qualifyingCount': None}
