"""Explicit entry gates. These are research rules, not a calibrated recommendation."""
from statistics import mean
from .engine import analyze as base_analyze, check

VERSION = '2.0.0'
QUALIFYING = {'READY', 'APPROACHING', 'QUALITY'}

def analyze(record, benchmark=None, today=None):
    a = base_analyze(record, benchmark, today)
    t = a['technical']; bars = t.get('bars', [])
    entry = dict(zoneLow=None, zoneHigh=None, invalidation=None, target=None, riskReward=None,
                 distance=None, confirmation=[], passed=False)
    if t['available']:
        p=t['price']; width=t['profile'][1]['price']-t['profile'][0]['price']
        nodes=[b for b in t['profile'] if b['volume']>0 and b['volume']>=max(x['volume'] for x in t['profile'])*.5 and b['price']-width/2<=p]
        node=max(nodes,key=lambda b:b['price']) if nodes else None
        sma50_before=mean(b['close'] for b in bars[-70:-20]); sma200_before=mean(b['close'] for b in bars[-220:-20]) if len(bars)>=220 else None
        t['checks']=[c for c in t['checks'] if c['key']!='slope'] + [
            check('ma50rise','50 日均線上升',t['sma50']-sma50_before,t['sma50']>sma50_before,'目前 MA50 高於 20 個交易日前'),
            check('ma200rise','200 日均線上升',None if sma200_before is None else t['sma200']-sma200_before,sma200_before is not None and t['sma200']>sma200_before,'目前 MA200 高於 20 個交易日前；需 220 日資料')]
        t['passed']=all(c['status']=='pass' for c in t['checks'])
        avg_volume=mean(b['volume'] for b in bars[-21:-1])
        volume_ratio=bars[-1]['volume']/avg_volume if avg_volume>0 else None
        if node:
            low=node['price']-width/2; high=node['price']+width/2
            invalid=low-.5*t['atr14']; target=max(b['high'] for b in bars[-64:-1])
            distance=max(0,p/high-1)
            rr=(target-p)/(p-invalid) if 0<invalid<p<target else None
            confirmation=[check('reclaim','站回前日高點',p,p>bars[-2]['high'],'最新完整日線收盤高於前一交易日最高價'),
                          check('volume','成交量確認',volume_ratio,volume_ratio is not None and volume_ratio>=1,'最新日成交量 ≥ 前 20 日平均量'),
                          check('zone','回測支撐區',bars[-1]['low'],bars[-1]['low']<=high and p>=low,'最新日最低價觸及區間上緣，收盤守住下緣')]
            entry=dict(zoneLow=low,zoneHigh=high,invalidation=invalid,target=target,riskReward=rr,distance=distance,confirmation=confirmation,
                       passed=distance<=.02 and rr is not None and rr>=2 and all(c['status']=='pass' for c in confirmation))
        t['support']=entry['zoneLow']; t['distanceToSupport']=entry['distance']
    a['entry']=entry
    fresh=a['status']!='incomplete'; quality=a['fundamentals']['passed'] and fresh
    a['dualPass']=quality and t['passed']
    if not fresh: status='INCOMPLETE'; reasons=['資料缺漏、過期或不適用，無法判定']
    elif not quality: status='WAIT'; reasons=[c['label']+'未通過' for c in a['fundamentals']['checks'] if c['status']!='pass']
    elif not t['passed']: status='QUALITY'; reasons=['基本面條件通過；等待上升趨勢確認']
    elif entry['passed']: status='READY'; reasons=['基本面與趨勢通過','距離成交密集區 ≤ 2%，回測與量價確認','歷史高點作為目標，報酬／風險 ≥ 2']
    elif entry['distance'] is not None and entry['distance']<=.05:
        status='APPROACHING'; reasons=['基本面與趨勢通過；距離成交密集區 ≤ 5%','仍等待確認訊號或足夠風險報酬']
    else: status='QUALITY'; reasons=['基本面與趨勢通過；等待回撤至成交密集區']
    a.update(status=status,reasons=reasons,methodVersion=VERSION)
    return a
