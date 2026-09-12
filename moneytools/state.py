"""Durable scan transitions; first observation is a baseline, never a new opportunity."""
from datetime import datetime
from zoneinfo import ZoneInfo
from .setup import QUALIFYING, VERSION

def transition(previous, stocks, errors, generated_at):
    day=datetime.fromisoformat(generated_at).astimezone(ZoneInfo('Asia/Taipei')).date().isoformat()
    previous=previous or {}
    compatible=previous.get('methodVersion')==VERSION
    old=previous.get('lastObserved',{}) if compatible else {}
    same_day=previous.get('scanDate')==day and compatible
    events={e['symbol']:e for e in previous.get('newOpportunities',[])} if same_day else {}
    observed=dict(old)
    for s in stocks:
        symbol=s['symbol']; prior=old.get(symbol)
        # Incomplete financial/market data must not reset a known qualifying state.
        if s['status']=='INCOMPLETE':
            events.pop(symbol,None)
            continue
        price_date=s['technical'].get('priceDate')
        if prior and price_date and prior.get('priceDate') and price_date<prior['priceDate']:
            events.pop(symbol,None)
            continue
        is_new=prior and s['status'] in QUALIFYING and prior['status']!=s['status']
        changed_data=prior and (price_date!=prior.get('priceDate') or s['financials'].get('fiscalDate')!=prior.get('fiscalDate'))
        if is_new and changed_data:
            events[symbol]=dict(symbol=symbol,status=s['status'],previousStatus=prior['status'],detectedAt=generated_at,reasons=s['reasons'])
        elif symbol in events and events[symbol]['status']!=s['status']:
            events.pop(symbol,None)
        observed[symbol]=dict(status=s['status'],priceDate=price_date,fiscalDate=s['financials'].get('fiscalDate'),observedAt=generated_at)
    for e in errors: events.pop(e['symbol'],None)
    active={s['symbol'] for s in stocks if s['status'] in QUALIFYING}
    events={k:v for k,v in events.items() if k in active}
    return dict(scanDate=day,baseline=not bool(old),previousScanAt=previous.get('generatedAt'),
                lastObserved=observed,newOpportunities=list(events.values()))
