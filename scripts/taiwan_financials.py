"""Bounded official ingestion: 8 workers with a global one-request/second limit, 10 companies per report, daily verified cache."""
import argparse,hashlib,json,sys,time,threading
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
from datetime import datetime,timezone
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlparse,parse_qs
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from moneytools.taiwan.financials import report_url,parse_report,metrics

def collect(audit_path,output,limit=2500):
 audit=json.loads(Path(audit_path).read_text());output=Path(output);output.mkdir(parents=True,exist_ok=True)
 groups=defaultdict(list);results={};errors=[];counter=[0];last_request=[0.0];lock=threading.Lock();stop=threading.Event();cache={};today=datetime.now(timezone.utc).date().isoformat()
 for p in output.glob('*.json'):
  if p.name=='financials.json':continue
  try:
   saved=json.loads(p.read_text())
   if saved['retrievedAt'][:10]!=today:continue
   kind=parse_qs(urlparse(saved['url']).query)['compareItem'][0]
   for s,r in saved['records'].items():cache[(s,r['year'],r['quarter'],kind)]=(r,{k:saved[k] for k in ('url','retrievedAt','sha256')})
  except (ValueError,KeyError):continue
 for stock in audit['stocks']:
  f=stock.get('incomePeriodRaw')
  if not f or stock['industryCode'] in ('17','14'):continue
  year=int(f['year']);year=year+1911 if year<1911 else year;groups[(year,int(f['quarter']))].append(stock['symbol'])
 jobs=[(y,q,sorted(symbols[i:i+10])) for (y,q),symbols in groups.items() for i in range(0,len(symbols),10)]
 def batch_job(job):
  year,quarter,batch=job;records={s:{} for s in batch};sources={s:[] for s in batch};failed=[]
  periods={(year,quarter),(year-1,4),(year-1,quarter),(year-2,4),(year-2,quarter)} if quarter!=4 else {(year,4),(year-1,4)}
  for y,q in sorted(periods):
   for kind in ('IncomeStatement','CashflowStatement'):
    if kind=='CashflowStatement' and (y,q) not in {(year,quarter),(year-1,4),(year-1,quarter)}:continue
    missing=[]
    for s in batch:
     hit=cache.get((s,y,q,kind))
     if hit:records[s][(y,q,kind)]=hit[0];sources[s].append(hit[1])
     else:missing.append(s)
    if not missing:continue
    if stop.is_set():break
    url=report_url(missing,y,q,kind)
    try:
     with lock:
      if counter[0]>=limit:stop.set();raise RuntimeError('Request budget exhausted')
      time.sleep(max(0,1-(time.monotonic()-last_request[0])))
      last_request[0]=time.monotonic();counter[0]+=1
     with urlopen(Request(url,headers={'User-Agent':'Moneytools/0.1'}),timeout=35) as r:raw=r.read(4_000_001)
     if len(raw)>4_000_000:raise ValueError('Oversized report')
     if b'FOR SECURITY REASONS' in raw or b'Access Denied' in raw:stop.set();raise PermissionError('Official source denied access')
     parsed=parse_report(raw.decode('utf-8'),missing,y,q)
     meta={'url':url,'retrievedAt':datetime.now(timezone.utc).isoformat(),'sha256':hashlib.sha256(raw).hexdigest()}
     target=output/(hashlib.sha256(url.encode()).hexdigest()+'.json');temp=target.with_suffix('.tmp');temp.write_text(json.dumps({**meta,'records':parsed},ensure_ascii=False));temp.replace(target)
     for s in missing:
      if s in parsed:records[s][(y,q,kind)]=parsed[s];sources[s].append(meta)
    except Exception as e:
     failed.append({'symbols':missing,'period':f'{y}Q{q}','kind':kind,'error':str(e)[:180]})
     if '429' in str(e) or '403' in str(e):stop.set()
    time.sleep(.5)
  return {s:{'financials':metrics(records[s],year,quarter),'sources':sources[s]} for s in batch},failed
 with ThreadPoolExecutor(max_workers=8) as pool:
  for result,failed in pool.map(batch_job,jobs):
   results.update(result);errors.extend(failed)
   target=output/'financials.json';temp=target.with_suffix('.tmp');temp.write_text(json.dumps({'generatedAt':datetime.now(timezone.utc).isoformat(),'companies':results,'errors':errors,'requests':counter[0],'complete':not stop.is_set() and len(results)==sum(map(len,groups.values()))},ensure_ascii=False,allow_nan=False));temp.replace(target)
   print(json.dumps({'processed':len(results),'total':sum(map(len,groups.values())),'errors':len(errors),'requests':counter[0]}),flush=True)
 if stop.is_set():raise RuntimeError('Collection stopped at request/access limit; partial data is not a successful run')
 return results
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--audit',required=True);p.add_argument('--output',required=True);p.add_argument('--limit',type=int,default=2500);a=p.parse_args();collect(a.audit,a.output,a.limit)
