"""Taiwan-only transparent rules. Never mutate US rules or fill missing data with zero."""
from datetime import date
from statistics import mean
from .official import number

VERSION='tw-1.0.0'
RULES={'minRevenueTWD':1_000_000_000,'minGrowth':.15,'minTurnoverTWD':20_000_000,'maxPriceAgeDays':5,'maxFiscalAgeDays':210,'minBars':220}

def check(key,label,value,passed,detail,unit=''):
    return {'key':key,'label':label,'value':value,'status':'missing' if value is None else ('pass' if passed else 'fail'),'detail':detail,'unit':unit}

def analyze(stock, financial=None, history=None, today=None):
    today=today or date.today(); f=(financial or {}).get('financials',{}); h=history or {}; warnings=list(f.get('warnings',[])); quote=stock.get('quote') or {}
    r=number(f.get('revenue')); g=number(f.get('growth')); op=number(f.get('operatingIncome')); ocf=number(f.get('operatingCashflow')); fcf=number(f.get('freeCashflow'))
    margin=op/r if op is not None and r is not None and r>0 else None
    checks=[check('revenue','近四季營收',r,r is not None and r>=RULES['minRevenueTWD'],'近四季營收 ≥ 10 億元；排除營運規模極小者','TWD'),check('growth','近四季營收年增',g,g is not None and r is not None and number(f.get('previousRevenue')) is not None and r >= f['previousRevenue']*1.15,'近四季合計比前一年同期 ≥ 15%；避免單月波動','percent'),check('margin','營業利益率',margin,margin is not None and margin>0,'近四季營業利益 ÷ 營收 > 0；確認本業獲利','percent'),check('ocf','營業現金流',ocf,ocf is not None and ocf>0,'近四季營業現金流 > 0；確認營運產生現金','TWD'),check('fcf','自由現金流',fcf,fcf is not None and fcf>0,'近四季營業現金流 − 取得不動產、廠房及設備支出絕對值 > 0','TWD')]
    fiscal_date=None
    if f.get('period'):
        import calendar
        y,q=f['period'].split('Q'); y=int(y); month=int(q)*3; fiscal_date=date(y,month,calendar.monthrange(y,month)[1])
    eligible=stock.get('industryCode') not in ('14','17') and fiscal_date is not None and 0<=(today-fiscal_date).days<=210 and f.get('currency')=='TWD'
    if stock.get('industryCode') in ('14','17'): warnings.append('金融保險與建材營造業暫不套用一般企業規則')
    if fiscal_date is None or not 0<=(today-fiscal_date).days<=210: warnings.append('近四季財報期間缺漏、未到期或超過 210 日')
    fp=eligible and all(c['status']=='pass' for c in checks)
    bars=h.get('bars',[]); technical_checks=[]; ma50=ma200=avg=None; fresh=False; matched=False
    if quote.get('date'):
        fresh=0<=(today-date.fromisoformat(quote['date'])).days<=5
    if len(bars)>=220 and bars[-1]['date']==quote.get('date') and number(quote.get('close')) is not None:
        matched=abs(bars[-1]['rawClose']-quote['close'])<=max(.02,quote['close']*.001)
        closes=[b['close'] for b in bars]; ma50=mean(closes[-50:]); ma200=mean(closes[-200:]); avg=mean(b['turnover'] for b in bars[-20:]); p=closes[-1]
        technical_checks=[check('alignment','均線多頭排列',p,p>ma50>ma200,'還原收盤價 > MA50 > MA200','TWD'),check('ma50rise','50 日均線上升',ma50-mean(closes[-70:-20]),ma50>mean(closes[-70:-20]),'MA50 高於 20 個交易日前','TWD'),check('ma200rise','200 日均線上升',ma200-mean(closes[-220:-20]),ma200>mean(closes[-220:-20]),'MA200 高於 20 個交易日前；至少 220 日資料','TWD'),check('liquidity','近 20 日流動性',avg,avg>=RULES['minTurnoverTWD'],'近 20 日平均原始收盤價 × 成交股數 ≥ 2,000 萬元（成交金額近似值）','TWD')]
    if not technical_checks:
        technical_checks=[check(k,l,None,False,d) for k,l,d in [('alignment','均線多頭排列','需要至少 220 日完整行情'),('ma50rise','50 日均線上升','等待完整日線'),('ma200rise','200 日均線上升','等待完整日線'),('liquidity','近 20 日流動性','等待完整日線')]]
    if not fresh: warnings.append('官方行情日期缺漏或超過 5 日')
    if not matched: warnings.append('歷史行情不足，或末日與官方收盤價尚未核對一致')
    tp=fresh and matched and all(c['status']=='pass' for c in technical_checks)
    status='DUAL' if fp and tp else ('FUNDAMENTAL' if fp else ('INCOMPLETE' if not eligible or any(c['status']=='missing' for c in checks) else 'WAIT'))
    return {**stock,'methodVersion':VERSION,'status':status,'qualification':status if fp else None,'financials':f,'financialSources':(financial or {}).get('sources',[]),'fundamentals':{'passed':fp,'checks':checks},'technical':{'passed':tp,'valid':fresh and matched,'checks':technical_checks,'sma50':ma50,'sma200':ma200,'avgTurnover':avg,'bars':bars[-252:],'source':h.get('source'),'retrievedAt':h.get('retrievedAt'),'priceBasis':'含股息及分割調整，換算為末日收盤價尺度','matchedOfficialClose':matched},'entry':entry_conditions(bars) if matched and fresh else {'available':False,'passed':False,'checks':[]},'dualPass':fp and tp,'warnings':warnings,'blockers':warnings,'today':False}


def entry_conditions(bars):
    """Daily-volume profile approximation on the same adjusted OHLC basis as trend."""
    from moneytools.engine import technical
    t=technical(bars)
    empty={'available':False,'passed':False,'checks':[]}
    if not t['available']: return empty
    bars=t['bars']; price=t['price']; profile=t['profile']; width=profile[1]['price']-profile[0]['price']
    peak=max(b['volume'] for b in profile)
    nodes=[b for b in profile if b['volume']>0 and b['volume']>=peak*.5 and b['price']-width/2<=price]
    if not nodes: return empty
    node=max(nodes,key=lambda b:b['price']); low=node['price']-width/2; high=node['price']+width/2
    invalid=low-.5*t['atr14']; target=max(b['high'] for b in bars[-64:-1]); distance=max(0,price/high-1)
    rr=(target-price)/(price-invalid) if 0<invalid<price<target else None
    avg=mean(b['volume'] for b in bars[-21:-1]); ratio=bars[-1]['volume']/avg if avg>0 else None
    checks=[check('distance','距離觀察區',distance,price<=high*1.02,'收盤高於區間上緣的距離 ≤ 2%','percent'),check('rr','報酬／風險',rr,rr is not None and target-price>=2*(price-invalid),'前 63 日高點作為觀察目標，報酬／風險 ≥ 2:1','ratio'),check('reclaim','站回前日高點',price,price>bars[-2]['high'],'收盤嚴格高於前一日最高價','TWD'),check('volume','成交量確認',ratio,ratio is not None and ratio>=1,'最新日成交量 ≥ 前 20 日平均量','ratio'),check('zone','回測觀察區',bars[-1]['low'],bars[-1]['low']<=high and price>=low,'最低價觸及區間上緣，收盤守住下緣','TWD')]
    return {'available':True,'passed':all(c['status']=='pass' for c in checks),'checks':checks,'zoneLow':low,'zoneHigh':high,'invalidation':invalid,'target':target,'riskReward':rr}
