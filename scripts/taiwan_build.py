import argparse,json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from moneytools.taiwan.publish import build,publish
from moneytools.taiwan.financials import verify_latest

def run(data,public,allow_partial=False):
    data=Path(data); public=Path(public)
    audit=json.loads((data/'live/source-audit.json').read_text()); fp=data/'financials/financials.json'
    financial_payload=json.loads(fp.read_text()) if fp.exists() else {}
    if not allow_partial and not financial_payload.get('complete'): raise ValueError('Initial financial collection unfinished; publication refused')
    financials=financial_payload.get('companies',{})
    captures=[json.loads(p.read_text()) for p in (data/'financials').glob('*.json') if p.name!='financials.json']
    original_financials=financials
    financials,mismatches=verify_latest(audit,financials,captures)
    for identity in mismatches:
        symbol=identity.split(':')[1]; original=original_financials.get(symbol,{})
        financials[symbol]={'financials':{'warnings':['\u5b98\u65b9\u7576\u671f\u8ca1\u5831\u91d1\u984d\u5c1a\u672a\u901a\u904e\u96d9\u4f86\u6e90\u6838\u5c0d\uff0c\u66ab\u4e0d\u5224\u5b9a']},'sources':original.get('sources',[])}
    histories={}
    for p in (data/'history').glob('*.json'):
        if p.stem.startswith(('TWSE-','TPEX-')): histories[p.stem.replace('-',':')]=json.loads(p.read_text())
    pp=public/'current/dashboard.json'; previous=json.loads(pp.read_text()) if pp.exists() else None
    snapshot=build(audit,financials,histories,previous)
    snapshot['financialCrossCheckMismatches']=mismatches
    snapshot['collectionComplete']=bool(financial_payload.get('complete'))
    if not allow_partial and (snapshot['financialCount'] < len(snapshot['stocks'])*.7 or sum(s['technical']['valid'] for s in snapshot['stocks']) < len(snapshot['stocks'])*.8): raise ValueError('Source coverage below publication floor; previous release preserved')
    publish(snapshot,public)
    print(json.dumps({k:snapshot[k] for k in ('counts','financialCount','historyCount')},ensure_ascii=False))

if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('--data',required=True); p.add_argument('--public',required=True); p.add_argument('--allow-partial',action='store_true',help='Local preview only; never use for production'); a=p.parse_args(); run(a.data,a.public,a.allow_partial)
