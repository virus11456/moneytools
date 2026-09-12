"""Persist the previous successful scan and state in Git; publish a complete snapshot atomically."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import json,time
from update_universe import refresh
from datetime import datetime
from zoneinfo import ZoneInfo
from moneytools.provider import fetch_record
from moneytools.setup import analyze,VERSION
from moneytools.engine import RULES
from moneytools.state import transition, daily_changes
from moneytools.recovery import collect_with_retries, reusable, retain_failed
ROOT=Path(__file__).resolve().parents[1]
def run():
    target=ROOT/'public/data/daily.json'
    previous=json.loads(target.read_text()) if target.exists() else {}
    universe_meta=refresh()
    symbols=json.loads((ROOT/'universe.json').read_text()); results=[]; errors=[]
    started=datetime.now(ZoneInfo('UTC')).isoformat()
    reused=reusable(previous,symbols,started)
    reused_symbols={s['symbol'] for s in reused}
    pending=[s for s in symbols if s not in reused_symbols]
    archive_path=target.parent/'previous.json'
    archive=json.loads(archive_path.read_text()) if archive_path.exists() else {}
    # Benchmark is descriptive, not a qualification gate; avoid extra calls during recovery.
    def collect(symbol):
        return analyze(fetch_record(symbol),[],today=datetime.now(ZoneInfo('America/New_York')).date())
    fetched,errors,recovery=collect_with_retries(pending,collect,time.sleep)
    results=sorted(reused+fetched,key=lambda s:s['symbol'])
    if not results: raise RuntimeError('所有請求失敗；保留原快照')
    recovery['reused']=len(reused)
    # Keep chart payload compact; computed checks retain the full OHLCV analysis.
    for item in results:
        item['technical']['bars']=[dict(date=b['date'],close=round(b['close'],4)) for b in item['technical']['bars']]
    generated=datetime.now(ZoneInfo('UTC')).isoformat()
    retained=retain_failed(previous,archive,errors,symbols,generated)
    state=transition(previous,results,errors,generated)
    changes=daily_changes(previous,results,errors,generated)
    payload=dict(generatedAt=generated,schedule='每天台北時間 07:15 啟動；排程及部署可能延遲',market='US',
        retainedStocks=retained,recovery=recovery,universe=symbols,universeMeta=universe_meta,coverage=len(results),validCoverage=sum(s['status']!='INCOMPLETE' for s in results),incompleteCoverage=sum(s['status']=='INCOMPLETE' for s in results),errors=errors,rules=RULES,stocks=results,source='Yahoo Finance / yfinance',methodVersion=VERSION,**state,**changes)
    target.parent.mkdir(parents=True,exist_ok=True)
    if previous:
        (target.parent/'previous.json').write_text(json.dumps(previous,ensure_ascii=False,allow_nan=False,separators=(',',':')))
    temp=target.with_suffix('.tmp');temp.write_text(json.dumps(payload,ensure_ascii=False,allow_nan=False,separators=(',',':')));temp.replace(target)
    print(f'Saved {len(results)} records; {len(errors)} failures; {len(state["newOpportunities"])} new opportunities',flush=True)
if __name__=='__main__':run()
