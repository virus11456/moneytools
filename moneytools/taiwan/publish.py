"""Independent Taiwan snapshot and 30 scan-day history; atomic directory publication."""
import json, os, shutil
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo
from .analysis import analyze, VERSION, RULES

def build(audit,financials,histories,previous=None,now=None):
    now=now or datetime.now(timezone.utc); day=now.astimezone(ZoneInfo('Asia/Taipei')).date(); prior={s['id']:s for s in (previous or {}).get('stocks',[])}
    if len({s['symbol'] for s in audit['stocks']})!=len(audit['stocks']): raise ValueError('Ambiguous symbol across Taiwan exchanges; preserve prior snapshot')
    stocks=[]; changes=[]; baseline=not prior
    for source in audit['stocks']:
        s=analyze(source,financials.get(source['symbol']),histories.get(source['id']),today=day)
        p=prior.get(s['id']); qualified=s['fundamentals']['passed']
        # First successful baseline is not a mass "today" event. Same-day rescans preserve labels.
        added=bool(p and ((p['status']=='WAIT' and qualified) or (p['fundamentals']['passed'] and p['technical'].get('valid') and not p['dualPass'] and s['dualPass'])))
        s['today']=added or bool(p and p.get('today') and (previous or {}).get('scanDate')==day.isoformat() and qualified)
        if p and s['status']!=p['status']: changes.append({'id':s['id'],'symbol':s['symbol'],'name':s['name'],'from':p['status'],'to':s['status']})
        stocks.append(s)
    if not stocks: raise ValueError('Empty Taiwan universe; refuse publication')
    return {'market':'TW','methodVersion':VERSION,'generatedAt':now.isoformat(),'scanDate':day.isoformat(),'baseline':baseline,'sources':audit['sources'],'rules':RULES,'stocks':stocks,'dailyChanges':changes,'coverage':audit['coverage'],'counts':{k:sum(s['status']==k for s in stocks) for k in ('DUAL','FUNDAMENTAL','WAIT','INCOMPLETE')},'historyCount':sum(bool(s['technical']['bars']) for s in stocks),'financialCount':sum(bool(s['financials'].get('revenue') is not None) for s in stocks),'notes':['本版為公開研究規則，尚未經回測驗證。','月營收為補充觀察；正式成長門檻使用近四季同比，不以單月代替。','成交金額採原始收盤價乘成交股數近似，與實際成交總額有差異。','處置、停止交易、重大訊息須於交易前至交易所查核；通過不是下單訊號。']}

def publish(snapshot,root):
    root=Path(root); root.mkdir(parents=True,exist_ok=True); current=root/'current'
    release=root/('release-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')); release.mkdir()
    try:
        details=release/'stocks'; details.mkdir()
        summaries=[]
        for s in snapshot['stocks']:
            (details/(s['symbol']+'.json')).write_text(json.dumps(s,ensure_ascii=False,allow_nan=False,separators=(',',':')))
            # Home needs only identities, quotes and gate summaries. Full reports stay on detail endpoints.
            summary={k:s[k] for k in ('id','market','symbol','name','status','quote','qualification','today','dualPass')}
            for section in ('fundamentals','technical'):
                summary[section]={k:v for k,v in s[section].items() if k in ('passed','valid')}
                summary[section]['checks']=[{k:c[k] for k in ('key','label','status')} for c in s[section]['checks']]
            summaries.append(summary)
        dashboard={**snapshot,'stocks':summaries}
        (release/'dashboard.json').write_text(json.dumps(dashboard,ensure_ascii=False,allow_nan=False,separators=(',',':')))
        history=[]
        if (current/'history.json').exists(): history=json.loads((current/'history.json').read_text())
        history=[h for h in history if h['scanDate']!=snapshot['scanDate']]
        history.append({k:snapshot[k] for k in ('scanDate','generatedAt','counts','dailyChanges')})
        (release/'history.json').write_text(json.dumps(history[-30:],ensure_ascii=False))
        for p in release.rglob('*'): p.chmod(0o755 if p.is_dir() else 0o644)
        release.chmod(0o755)
        pending=root/'current.new'; pending.unlink(missing_ok=True); pending.symlink_to(release.name); os.replace(pending,current)
        # Public releases are bounded; daily observation history lives inside every release.
        for old in sorted(root.glob('release-*'))[:-3]:
            if old.is_dir() and not old.is_symlink() and old!=current.resolve(): shutil.rmtree(old)
    except Exception:
        if current.resolve()!=release: shutil.rmtree(release)
        raise
