"""Persist the previous successful scan and state in Git; publish a complete snapshot atomically."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import json,time
from concurrent.futures import ThreadPoolExecutor
from update_universe import refresh
from datetime import datetime
from zoneinfo import ZoneInfo
from moneytools.provider import fetch_record,benchmark
from moneytools.setup import analyze,VERSION
from moneytools.engine import RULES
from moneytools.state import transition, daily_changes
ROOT=Path(__file__).resolve().parents[1]
def run():
    target=ROOT/'public/data/daily.json'
    previous=json.loads(target.read_text()) if target.exists() else {}
    universe_meta=refresh()
    symbols=json.loads((ROOT/'universe.json').read_text()); results=[]; errors=[]
    try: bm=benchmark()
    except Exception: bm=[]
    def collect(symbol):
        for attempt in range(2):
            try:
                item=analyze(fetch_record(symbol),bm,today=datetime.now(ZoneInfo('America/New_York')).date())
                print(symbol,item['status'],flush=True)
                time.sleep(.4)
                return item, None
            except Exception as exc:
                if attempt == 0:
                    time.sleep(3)
                else:
                    print(symbol,type(exc).__name__,flush=True)
                    return None, dict(symbol=symbol,message='本次資料取得失敗；保留上次狀態，不算條件失效',kind=type(exc).__name__)
    # Bounded concurrency keeps the expanded daily scan practical without a request burst.
    with ThreadPoolExecutor(max_workers=3) as pool:
        for item,error in pool.map(collect,symbols):
            if item: results.append(item)
            if error: errors.append(error)
    if not results: raise RuntimeError('所有請求失敗；保留原快照')
    # Keep chart payload compact; computed checks retain the full OHLCV analysis.
    for item in results:
        item['technical']['bars']=[dict(date=b['date'],close=round(b['close'],4)) for b in item['technical']['bars']]
    generated=datetime.now(ZoneInfo('UTC')).isoformat()
    state=transition(previous,results,errors,generated)
    changes=daily_changes(previous,results,errors,generated)
    payload=dict(generatedAt=generated,schedule='每天台北時間 07:15 啟動；排程及部署可能延遲',market='US',
        universe=symbols,universeMeta=universe_meta,coverage=len(results),validCoverage=sum(s['status']!='INCOMPLETE' for s in results),incompleteCoverage=sum(s['status']=='INCOMPLETE' for s in results),errors=errors,rules=RULES,stocks=results,source='Yahoo Finance / yfinance',methodVersion=VERSION,**state,**changes)
    target.parent.mkdir(parents=True,exist_ok=True)
    if previous:
        (target.parent/'previous.json').write_text(json.dumps(previous,ensure_ascii=False,allow_nan=False,separators=(',',':')))
    temp=target.with_suffix('.tmp');temp.write_text(json.dumps(payload,ensure_ascii=False,allow_nan=False,separators=(',',':')));temp.replace(target)
    print(f'Saved {len(results)} records; {len(errors)} failures; {len(state["newOpportunities"])} new opportunities',flush=True)
if __name__=='__main__':run()
