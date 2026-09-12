"""Transparent screening rules inspired by qbU7LHPZ4Xo; not a backtested strategy."""
import math
from datetime import date
from statistics import mean

RULES = {"minRevenue": 100_000_000, "minGrowth": .15, "idealGrowthMax": .20,
         "minDollarVolume": 10_000_000, "supportTolerance": .05,
         "trendMin": .05, "trendMax": .80, "maxPriceAgeDays": 5, "maxFiscalAgeDays": 550}

def num(value):
    try:
        n = float(value)
        return n if math.isfinite(n) else None
    except (ValueError, TypeError):
        return None

def check(key, label, value, passed, detail):
    return dict(key=key, label=label, value=value, status="missing" if value is None else ("pass" if passed else "fail"), detail=detail)

def technical(bars, benchmark=None):
    clean = [b for b in bars if all(num(b.get(k)) is not None for k in ('close','high','low','volume')) and b['close'] > 0 and b['volume'] >= 0]
    clean = sorted({b['date']: b for b in clean}.values(), key=lambda b:b['date'])
    if len(clean) < 200:
        return dict(available=False, reason="需要至少 200 個完整交易日", bars=clean, checks=[], passed=False)
    close = [b['close'] for b in clean]; p = close[-1]
    sma50, sma200 = mean(close[-50:]), mean(close[-200:])
    ys = [math.log(v) for v in close[-63:]]; center = 31
    slope = sum((i-center)*(v-mean(ys)) for i,v in enumerate(ys))/sum((i-center)**2 for i in range(63))
    annual = math.expm1(max(-10, min(10, slope*252)))
    clock = '12–1 點・急漲' if annual > .80 else ('2 點・上行' if annual >= .05 else ('3 點・盤整' if annual > -.05 else ('4 點・下行' if annual > -.40 else '5–6 點・急跌')))
    recent=clean[-126:]; lo=min(b['low'] for b in recent); hi=max(b['high'] for b in recent)
    width=(hi-lo)/24 if hi>lo else max(p*.001, .01)
    buckets=[0.0]*24
    # Approximation: assign each daily volume to its typical-price bin, not actual holdings.
    for b in recent:
        ix=max(0,min(23,int(((b['high']+b['low']+b['close'])/3-lo)/width)))
        buckets[ix]+=b['volume']
    profile=[dict(price=lo+(i+.5)*width, volume=v) for i,v in enumerate(buckets)]
    peak=max(buckets) if buckets else 0
    significant=[b for b in profile if peak>0 and b['volume']>=peak*.5]
    below=[b['price'] for b in significant if b['price']<=p]; above=[b['price'] for b in significant if b['price']>p]
    support=max(below) if below else None; resistance=min(above) if above else None
    distance=p/support-1 if support else None
    dollar=mean([b['close']*b['volume'] for b in clean[-20:]])
    tr=[max(b['high']-b['low'],abs(b['high']-clean[i-1]['close']),abs(b['low']-clean[i-1]['close'])) for i,b in enumerate(clean) if i>0]
    stock_return=close[-1]/close[-64]-1
    relative=None
    if benchmark:
        bm={b['date']:b['close'] for b in benchmark if num(b.get('close')) and b['close']>0}
        if clean[-1]['date'] in bm and clean[-64]['date'] in bm:
            relative=stock_return-(bm[clean[-1]['date']]/bm[clean[-64]['date']]-1)
    checks=[check('alignment','均線多頭排列',p,p>sma50>sma200,'收盤價 > 50 日均線 > 200 日均線'),
            check('slope','穩定上行趨勢',annual,.05<=annual<=.80,'63 日對數價格回歸，年化斜率 5%–80%；工程化近似，非螢幕角度'),
            check('liquidity','成交流動性',dollar,dollar>=RULES['minDollarVolume'],'近 20 日平均成交金額至少 1,000 萬美元')]
    return dict(available=True,passed=all(c['status']=='pass' for c in checks),checks=checks,price=p,
                change=p/close[-2]-1,sma50=sma50,sma200=sma200,slope=annual,clock=clock,
                support=support,resistance=resistance,distanceToSupport=distance,nearSupport=distance is not None and distance<=.05,
                atr14=mean(tr[-14:]),relativeStrength=relative,dollarVolume=dollar,
                profile=profile,bars=clean[-252:],priceDate=clean[-1]['date'])

def analyze(record, benchmark=None, today=None):
    today=today or date.today(); f=record.get('financials',{}); t=technical(record.get('bars',[]),benchmark)
    revenue=num(f.get('revenue')); prev=num(f.get('previousRevenue')); op=num(f.get('operatingIncome'))
    ocf=num(f.get('operatingCashflow')); capex=num(f.get('capitalExpenditure'))
    growth=revenue/prev-1 if revenue is not None and prev is not None and prev>0 else None
    margin=op/revenue if op is not None and revenue is not None and revenue>0 else None
    fcf=ocf-abs(capex) if ocf is not None and capex is not None else None
    usd=record.get('financialCurrency')=='USD'
    checks=[check('revenue','營收規模',revenue,revenue is not None and revenue>=RULES['minRevenue'],'最近完整年度 ≥ 1 億美元'),
            check('growth','營收成長',growth,growth is not None and growth>=.15,'年度年增 ≥ 15%；15%–20% 為講者偏好區間'),
            check('margin','核心獲利',margin,margin is not None and margin>0,'營業利益率 > 0；僅宜與同業比較'),
            check('ocf','營運產生現金',ocf,ocf is not None and ocf>0,'年度營業現金流 > 0'),
            check('fcf','自由現金流',fcf,fcf is not None and fcf>0,'營業現金流 − 資本支出絕對值 > 0')]
    warnings=[]
    if not usd: warnings.append('財報幣別不是 USD 或未知，未做匯率換算，暫不納入篩選')
    if record.get('sector') in ('Financial Services','Real Estate'): warnings.append('金融與不動產業的現金流結構不同，暫不套用一般企業篩選')
    fiscal=f.get('fiscalDate'); fresh_fiscal=False
    if fiscal:
        try: fresh_fiscal=0<=(today-date.fromisoformat(fiscal)).days<=RULES['maxFiscalAgeDays']
        except ValueError: pass
    if not fresh_fiscal: warnings.append('財報日期缺漏或超過 550 天')
    fresh_price=False
    if t.get('priceDate'):
        fresh_price=0<=(today-date.fromisoformat(t['priceDate'])).days<=RULES['maxPriceAgeDays']
    if not fresh_price: warnings.append('行情不足或超過 5 個日曆日，暫不入選')
    if growth is not None and growth>.20: warnings.append('營收成長超過 20%，需另查成長能否持續')
    eligible=usd and record.get('sector') not in ('Financial Services','Real Estate') and fresh_fiscal and fresh_price
    fundamental_pass=usd and fresh_fiscal and record.get('sector') not in ('Financial Services','Real Estate') and all(c['status']=='pass' for c in checks)
    dual=eligible and fundamental_pass and t['passed']
    status='pullback' if dual and t.get('nearSupport') else ('watch' if dual else ('incomplete' if not eligible or any(c['status']=='missing' for c in checks) or not t['available'] else 'excluded'))
    marketcap=num(record.get('marketCap')); income=num(f.get('netIncome')); equity=num(f.get('equity'))
    return {k:v for k,v in record.items() if k!='bars'} | dict(
        financials=f|dict(growth=growth,margin=margin,freeCashflow=fcf),
        fundamentals=dict(passed=fundamental_pass,checks=checks),technical=t,status=status,dualPass=dual,warnings=warnings,
        valuation=dict(ps=marketcap/revenue if marketcap and revenue and revenue>0 else None,
                       pe=marketcap/income if marketcap and income and income>0 else None,
                       pb=marketcap/equity if marketcap and equity and equity>0 else None),
        manualReview=['能否說清楚公司如何賺錢？','護城河與定價能力有何證據？','成長空間與主要風險是什麼？'])
