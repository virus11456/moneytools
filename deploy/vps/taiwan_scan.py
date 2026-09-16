"""Independent Taiwan ingestion. Publish only after complete collection and quality checks."""
import argparse,fcntl,json,os,subprocess,sys,time
from datetime import datetime,timezone
from pathlib import Path
from zoneinfo import ZoneInfo
APP=Path(os.environ.get('MONEYTOOLS_APP','/opt/moneytools'))
DATA=Path(os.environ.get('MONEYTOOLS_TW_DATA','/var/lib/moneytools/taiwan'))
PUBLIC=Path(os.environ.get('MONEYTOOLS_TW_PUBLIC','/var/www/moneytools-tw'))
sys.path.insert(0,str(APP));sys.path.insert(0,str(APP/'scripts'))

def should_run(now,last_date=None):
 local=now.astimezone(ZoneInfo('Asia/Taipei'))
 return local.weekday()<5 and (16<=local.hour<=22) and last_date!=local.date().isoformat()

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--force',action='store_true');args=parser.parse_args()
 DATA.mkdir(parents=True,exist_ok=True)
 with (DATA/'scan.lock').open('w') as lock:
  try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:print('Taiwan scan already active');return
  marker=DATA/'last-success.json';last=json.loads(marker.read_text()) if marker.exists() else {}
  now=datetime.now(timezone.utc)
  last_dates=last.get('marketDates',{})
  completed_day=now.astimezone(ZoneInfo('Asia/Taipei')).date().isoformat() if len(last_dates)==2 and all(v==now.astimezone(ZoneInfo('Asia/Taipei')).date().isoformat() for v in last_dates.values()) else None
  if not args.force and not should_run(now,completed_day):print('No Taiwan scan due');return
  def run(script,*values):subprocess.run([sys.executable,str(APP/'scripts'/script),*map(str,values)],check=True,timeout=14400)
  run('taiwan_sources.py','--download','--output',DATA/'live')
  audit=json.loads((DATA/'live/source-audit.json').read_text());dates=[s['quote']['date'] for s in audit['stocks'] if s.get('quote')];market_date=max(dates)
  market_dates={m:max((s['quote']['date'] for s in audit['stocks'] if s.get('quote') and s['market']==m),default='') for m in ('TWSE','TPEX')}
  # Official latest quote date is authoritative; weekends/holidays do not manufacture new scans.
  if not args.force and all(value<=last_dates.get(m,'') for m,value in market_dates.items()):print('No new official Taiwan trading day');return
  run('taiwan_financials.py','--audit',DATA/'live/source-audit.json','--output',DATA/'financials')
  financial=json.loads((DATA/'financials/financials.json').read_text())
  if not financial.get('complete') or len(financial['errors'])>max(3,len(financial['companies'])*.08):raise RuntimeError('Financial source coverage failed; previous release preserved')
  run('taiwan_history.py','--audit',DATA/'live/source-audit.json','--output',DATA/'history')
  run('taiwan_build.py','--data',DATA,'--public',PUBLIC)
  marker.write_text(json.dumps({'scanDate':now.astimezone(ZoneInfo('Asia/Taipei')).date().isoformat(),'marketDate':market_date,'marketDates':market_dates,'completedAt':datetime.now(timezone.utc).isoformat()}))
  # Private report cache retention; publication retains 3 releases and 30 daily observations.
  cutoff=time.time()-45*86400
  for directory in [DATA/'live/raw',DATA/'financials']:
   for p in directory.glob('*.json'):
    if p.name!='financials.json' and p.stat().st_mtime<cutoff:p.unlink()

if __name__=='__main__':main()
