"""Strict parser for MOPS financial comparison cumulative statements (TWD thousands)."""
from html.parser import HTMLParser
from urllib.parse import urlencode
import re
from .official import number

BASE = 'https://mopsfin.twse.com.tw/compare/report'

class Tables(HTMLParser):
    def __init__(self):
        super().__init__(); self.tables=[]; self.table=None; self.row=None; self.cell=None; self.inputs={}
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag=='table': self.table=[]; self.tables.append(self.table)
        elif tag=='tr': self.row=[]
        elif tag in ('td','th'): self.cell=[]
        elif tag=='br' and self.cell is not None: self.cell.append(' ')
        elif tag=='input': self.inputs.setdefault(attrs.get('name'),[]).append(attrs.get('value'))
    def handle_data(self, data):
        if self.cell is not None: self.cell.append(data)
    def handle_endtag(self, tag):
        if tag in ('td','th') and self.cell is not None:
            self.row.append(''.join(self.cell).strip()); self.cell=None
        elif tag=='tr' and self.row is not None:
            if self.table is not None: self.table.append(self.row)
            self.row=None
        elif tag=='table': self.table=None

def report_url(symbols, year, quarter, kind):
    if kind not in ('IncomeStatement','CashflowStatement') or quarter not in (1,2,3,4): raise ValueError('Invalid report')
    if not symbols or len(symbols)>50 or any(not re.fullmatch(r'[1-9]\d{3}',s) for s in symbols): raise ValueError('Invalid companies')
    return BASE+'?'+urlencode([('bcodeAvg','false'),('companyAvg','false'), *[('companyId',s) for s in symbols],('compareItem',kind),('quarter','false'),('ys',f'{year}{quarter}')])

def parse_report(html, symbols, year, quarter):
    if '金額單位：新台幣仟元' not in html: raise ValueError('Financial currency/unit unverified')
    p=Tables(); p.feed(html)
    if p.inputs.get('yearseason') != [f'{year}Q{quarter}']: raise ValueError('Financial period mismatch')
    if len(p.tables)!=2: raise ValueError('Unexpected financial table shape')
    labels, values=p.tables
    if len(labels)!=len(values) or len(values)<3: raise ValueError('Financial rows misaligned')
    if any(len(r)!=1 for r in labels): raise ValueError('Ambiguous financial labels')
    ids=[]
    for header in values[1]:
        match=re.match(r'([1-9]\d{3})\s',header)
        if not match: raise ValueError('Invalid company header')
        ids.append(match[1])
    if len(set(ids))!=len(ids) or not set(ids).issubset(set(symbols)): raise ValueError('Financial company mismatch')
    if any(len(r)!=len(ids) for r in values): raise ValueError('Financial columns misaligned')
    names=[r[0].strip() for r in labels[2:]]
    # Repeated descriptive labels exist in statements; only requested unique accounts are selected below.
    result={}
    for i,s in enumerate(ids):
        basis=values[0][i]
        if basis not in ('合併','個別','個體'): raise ValueError('Unknown consolidation basis')
        accounts={}
        for name in set(names):
            matches=[number(values[j+2][i]) for j,n in enumerate(names) if n==name]
            if len(matches)==1: accounts[name]=matches[0]*1000 if matches[0] is not None else None
        result[s]={'year':year,'quarter':quarter,'currency':'TWD','unit':'TWD','basis':basis,'accounts':accounts}
    return result

def metrics(reports, year, quarter):
    """TTM = current YTD + previous full year - previous same YTD; never mix basis."""
    periods=[(year,quarter)] if quarter==4 else [(year,quarter),(year-1,4),(year-1,quarter)]
    out={}; reasons=[]; bases=set()
    for kind, accounts in {'IncomeStatement':{'revenue':'營業收入合計','operatingIncome':'營業利益（損失）'},'CashflowStatement':{'operatingCashflow':'營業活動之淨現金流入（流出）','capitalExpenditure':'取得不動產、廠房及設備'}}.items():
        rs=[reports.get((y,q,kind)) for y,q in periods]
        for r in rs:
            if r: bases.add(r['basis'])
        for key,label in accounts.items():
            values=[r['accounts'].get(label) if r else None for r in rs]
            out[key]=None if any(v is None for v in values) else (values[0] if quarter==4 else values[0]+values[1]-values[2])
    # TTM growth versus the same four-quarter period one year earlier.
    prior=reports.get((year-1,4,'IncomeStatement')) if quarter==4 else None
    if quarter==4: previous=prior['accounts'].get('營業收入合計') if prior else None
    else:
        prs=[reports.get((y,q,'IncomeStatement')) for y,q in [(year-1,quarter),(year-2,4),(year-2,quarter)]]
        pv=[r['accounts'].get('營業收入合計') if r else None for r in prs]
        previous=None if any(v is None for v in pv) else pv[0]+pv[1]-pv[2]
        bases.update(r['basis'] for r in prs if r)
    if prior: bases.add(prior['basis'])
    if len(bases)!=1:
        out={k:None for k in out}; previous=None; reasons.append('財報合併口徑缺漏或不一致')
    out['previousRevenue']=previous
    out['growth']=out['revenue']/previous-1 if out['revenue'] is not None and previous is not None and previous>0 else None
    out['freeCashflow']=out['operatingCashflow']-abs(out['capitalExpenditure']) if out['operatingCashflow'] is not None and out['capitalExpenditure'] is not None else None
    out.update(period=f'{year}Q{quarter}',basis=next(iter(bases)) if len(bases)==1 else None,currency='TWD',warnings=reasons)
    return out


def verify_latest(audit, financials, captures):
    """Cross-check current cumulative amounts against the separate exchange OpenAPI."""
    from urllib.parse import urlparse,parse_qs
    current={}
    for capture in sorted(captures,key=lambda c:c.get('retrievedAt','')):
        if parse_qs(urlparse(capture.get('url','')).query).get('compareItem')!=['IncomeStatement']:continue
        for symbol,r in capture.get('records',{}).items():
            current[(symbol,r['year'],r['quarter'])]=r
    result={}; mismatches=[]
    for s in audit['stocks']:
        value=financials.get(s['symbol'])
        if not value:continue
        period=s.get('incomePeriodRaw') or {};y=number(period.get('year'));q=number(period.get('quarter'))
        if y is None or q is None:continue
        y=int(y)+1911 if y<1911 else int(y);report=current.get((s['symbol'],y,int(q)))
        expected=[period.get('revenueSourceValue'),period.get('operatingIncomeSourceValue')]
        observed=[report['accounts'].get(k) if report else None for k in ('營業收入合計','營業利益（損失）')]
        valid=all(e is not None and v is not None and abs(e*1000-v)<=1 for e,v in zip(expected,observed))
        if valid:result[s['symbol']]=value
        else:mismatches.append(s['id'])
    return result,mismatches
