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


def daily_changes(previous, stocks, errors, generated_at):
    """Report real gate changes, including exits; unknown data never implies failure."""
    day = datetime.fromisoformat(generated_at).astimezone(ZoneInfo('Asia/Taipei')).date().isoformat()
    previous = previous or {}
    compatible = previous.get('methodVersion') == VERSION
    old = dict(previous.get('gateObserved', {})) if compatible else {}
    # Migrate existing snapshots from their actual results without inventing history.
    if compatible and not old:
        old = {s['symbol']: gate(s) for s in previous.get('stocks', []) if s['status'] != 'INCOMPLETE'}
    same_day = compatible and previous.get('scanDate') == day
    events = {e['symbol']: e for e in previous.get('dailyChanges', [])} if same_day else {}
    observed = dict(old)
    baselines = []
    for s in stocks:
        symbol = s['symbol']
        if s['status'] == 'INCOMPLETE':
            events.pop(symbol, None)
            continue
        current = gate(s)
        prior = old.get(symbol)
        if not prior:
            baselines.append(symbol)
        elif current['priceDate'] and prior.get('priceDate') and current['priceDate'] < prior['priceDate']:
            events.pop(symbol, None)
            continue
        elif (current['priceDate'], current['fiscalDate']) != (prior.get('priceDate'), prior.get('fiscalDate')):
            # Compare with the day's first event origin so an entry update keeps today's new-gate label.
            origin = events.get(symbol, {}).get('before', prior)
            condition_changes = compare_checks(origin, current)
            kinds = []
            if not origin['fundamental'] and current['fundamental']: kinds.append('FUNDAMENTAL_ADDED')
            if not origin['dual'] and current['dual']: kinds.append('DUAL_ADDED')
            if origin['fundamental'] and not current['fundamental']: kinds.append('FUNDAMENTAL_LOST')
            elif origin['dual'] and not current['dual']: kinds.append('DUAL_LOST')
            if origin['status'] != current['status'] and current['dual'] and origin['dual']: kinds.append('ENTRY_CHANGED')
            if not kinds and condition_changes and (origin['fundamental'] or current['fundamental']):
                kinds.append('CONDITIONS_CHANGED')
            if not kinds:
                events.pop(symbol, None)
            if kinds:
                events[symbol] = dict(symbol=symbol, kinds=kinds, previousStatus=origin['status'], status=current['status'],
                    detectedAt=generated_at, previousPriceDate=prior.get('priceDate'), priceDate=current['priceDate'],
                    reasons=s['reasons'], before=origin, after=current, conditionChanges=condition_changes,
                    comparisonPriceDate=origin.get('priceDate'), comparisonFiscalDate=origin.get('fiscalDate'))
        # Keep an event only while the resulting gate state still applies.
        if symbol in events and any(events[symbol]['after'][k] != current[k] for k in ('fundamental','dual','status')):
            events.pop(symbol, None)
        observed[symbol] = current
    for error in errors: events.pop(error['symbol'], None)
    active = {s['symbol'] for s in stocks}
    return dict(gateObserved=observed, dailyChanges=[v for k,v in events.items() if k in active],
                changeBaselineSymbols=baselines)


def gate(s):
    return dict(fundamental=bool(s['fundamentals']['passed']), dual=bool(s['dualPass']), status=s['status'],
                priceDate=s['technical'].get('priceDate'), fiscalDate=s['financials'].get('fiscalDate'), checks=condition_snapshot(s))


def condition_snapshot(s):
    from .engine import check
    result = {}
    entry = s.get('entry', {})
    distance, rr = entry.get('distance'), entry.get('riskReward')
    groups = [('fundamental', s['fundamentals'].get('checks', [])),
              ('trend', s['technical'].get('checks', [])),
              ('entry', entry.get('confirmation', []) + [
                  check('distance', '接近進場區', distance, distance is not None and distance <= .02, '距離區間 ≤ 2%'),
                  check('rr', '報酬／風險', rr, rr is not None and rr >= 2, '報酬／風險 ≥ 2 倍')])]
    for group, checks in groups:
        for c in checks:
            result[group + ':' + c['key']] = dict(c, group=group)
    return result


def compare_checks(before, after):
    changes = []
    for key, current in after.get('checks', {}).items():
        prior = before.get('checks', {}).get(key)
        # Missing data is not evidence that a condition passed or failed.
        if prior and prior['status'] in ('pass', 'fail') and current['status'] in ('pass', 'fail') and prior['status'] != current['status']:
            changes.append(dict(key=key, label=current['label'], group=current['group'],
                                before=prior, after=current))
    return changes
