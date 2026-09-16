"""Taiwan daily history; Yahoo is disclosed supplemental history, official quote is the gate."""
import argparse, json, sys, time, os
from pathlib import Path
from datetime import datetime, timezone
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from moneytools.taiwan.official import number

def collect(audit_path,output,limit=2100):
    import yfinance as yf
    root=Path(output); root.mkdir(parents=True,exist_ok=True); yf.set_tz_cache_location(str(root/'yf-cache'))
    audit=json.loads(Path(audit_path).read_text()); errors=[]; done=0; consecutive_errors=0
    for stock in audit['stocks'][:limit]:
        symbol=stock['symbol']; market=stock['market']; target=root/f'{market}-{symbol}.json'; expected=(stock.get('quote') or {}).get('date')
        if not expected: continue
        try:
            if target.exists() and json.loads(target.read_text()).get('priceDate')==expected: continue
            ticker=symbol+('.TW' if market=='TWSE' else '.TWO')
            data=yf.Ticker(ticker).history(period='2y',auto_adjust=False,timeout=15)
            rows=[]
            for idx,row in data.iterrows():
                day=idx.date().isoformat()
                if day>expected: continue
                values={k:number(row.get(c)) for k,c in [('rawClose','Close'),('adjustedClose','Adj Close'),('high','High'),('low','Low'),('volume','Volume')]}
                if any(v is None for v in values.values()) or min(values['rawClose'],values['adjustedClose'],values['low'])<=0 or values['volume']<0: continue
                rows.append({'date':day,**values})
            if not rows: raise ValueError('No usable history')
            final_factor=rows[-1]['adjustedClose']/rows[-1]['rawClose']
            for b in rows:
                factor=b['adjustedClose']/b['rawClose']/final_factor
                b.update(close=b['rawClose']*factor,high=b['high']*factor,low=b['low']*factor,turnover=b['rawClose']*b['volume'])
            payload={'source':'Yahoo Finance / yfinance (supplemental history)','symbol':ticker,'retrievedAt':datetime.now(timezone.utc).isoformat(),'priceDate':rows[-1]['date'],'bars':rows}
            temp=target.with_suffix('.tmp'); temp.write_text(json.dumps(payload,allow_nan=False)); temp.replace(target); done+=1; consecutive_errors=0
        except Exception as e:
            errors.append({'id':stock['id'],'error':str(e)[:160]}); consecutive_errors+=1
            if 'RateLimit' in type(e).__name__ or '429' in str(e) or consecutive_errors>=5:
                (root/'history-status.json').write_text(json.dumps({'completedAt':datetime.now(timezone.utc).isoformat(),'done':done,'errors':errors},ensure_ascii=False))
                raise RuntimeError('History collection stopped; preserve previous public release') from e
        if (done+len(errors))%20==0: print(json.dumps({'done':done,'errors':len(errors)}),flush=True)
        time.sleep(.3)
    (root/'history-status.json').write_text(json.dumps({'completedAt':datetime.now(timezone.utc).isoformat(),'done':done,'errors':errors},ensure_ascii=False))

if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('--audit',required=True); p.add_argument('--output',required=True); p.add_argument('--limit',type=int,default=2100); a=p.parse_args(); collect(a.audit,a.output,a.limit)
