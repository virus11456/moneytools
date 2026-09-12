"""Conservative retries and dated fallbacks. No fallback is a fresh observation."""
from copy import deepcopy
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from .setup import VERSION


def rate_limited(exc):
    return type(exc).__name__ == 'YFRateLimitError' or '429' in str(exc) or 'too many requests' in str(exc).lower()


def collect_with_retries(symbols, fetch, sleep, *, pacing=1.5, cooldowns=(45, 90), log=print):
    pending = list(symbols)
    results = {}
    failures = {}
    attempts = {s: 0 for s in symbols}
    limits = 0
    first_failed = set()
    for round_index in range(len(cooldowns) + 1):
        if round_index:
            if not pending: break
            log(f'Cooling down {cooldowns[round_index-1]}s; retrying {len(pending)} symbols', flush=True)
            sleep(cooldowns[round_index-1])
        retry = []
        for index, symbol in enumerate(pending):
            attempts[symbol] += 1
            try:
                item = fetch(symbol)
                results[symbol] = item
                failures.pop(symbol, None)
                log(f'{symbol} {item["status"]} attempt={attempts[symbol]}', flush=True)
            except Exception as exc:
                limited = rate_limited(exc)
                failures[symbol] = dict(symbol=symbol, kind=type(exc).__name__, rateLimited=limited)
                first_failed.add(symbol)
                retry.append(symbol)
                log(f'{symbol} {type(exc).__name__} attempt={attempts[symbol]}', flush=True)
                if limited:
                    # Stop this entire pass: do not hammer the remaining symbols during a block.
                    limits += 1
                    retry.extend(pending[index+1:])
                    for deferred in pending[index+1:]:
                        failures.setdefault(deferred, dict(symbol=deferred, kind='DeferredAfterRateLimit', rateLimited=True))
                    break
            sleep(pacing)
            if (index + 1) % 25 == 0: sleep(5)
        pending = retry
    errors = [failures[s] | dict(attempts=attempts[s], message='補抓仍未取得；不推定條件失效') for s in symbols if s not in results]
    return list(results.values()), errors, dict(requested=len(symbols), attempts=sum(attempts.values()),
        recovered=len(first_failed & results.keys()), rateLimitPauses=limits, unresolved=len(errors))


def reusable(previous, symbols, generated_at):
    """Same Taipei day, same method and <6h snapshot: avoid re-fetching successful results."""
    if previous.get('methodVersion') != VERSION: return []
    now = datetime.fromisoformat(generated_at)
    day = now.astimezone(ZoneInfo('Asia/Taipei')).date().isoformat()
    if previous.get('scanDate') != day: return []
    ny = now.astimezone(ZoneInfo('America/New_York'))
    expected = ny.date() if (ny.hour, ny.minute) >= (16, 15) else (ny - timedelta(days=1)).date()
    while expected.weekday() > 4: expected -= timedelta(days=1)
    items = []
    for stock in previous.get('stocks', []):
        if stock['symbol'] not in symbols or stock.get('dataStatus') == 'retained': continue
        try: age = (now - datetime.fromisoformat(stock['fetchedAt'])).total_seconds()
        except (KeyError, ValueError, TypeError): continue
        # Missing statements may be an upstream partial response; let them be fetched again.
        checks = stock.get('fundamentals', {}).get('checks', [])
        if stock.get('technical', {}).get('priceDate') == expected.isoformat() and 0 <= age < 6*3600 and checks and not any(c['status'] == 'missing' for c in checks):
            items.append(deepcopy(stock))
    return items


def retain_failed(previous, archive, errors, symbols, generated_at):
    candidates = {}
    for snapshot in (archive or {}, previous or {}):
        if snapshot.get('methodVersion') != VERSION: continue
        for item in snapshot.get('retainedStocks', []) + snapshot.get('stocks', []):
            candidates[item['symbol']] = item
    retained = []
    for error in errors:
        symbol = error['symbol']
        if symbol not in candidates or symbol not in symbols: continue
        item = deepcopy(candidates[symbol])
        item['dataStatus'] = 'retained'
        item['lastAttemptAt'] = generated_at
        # Keep the original fetchedAt, priceDate, status and all original financial values.
        retained.append(item)
    return retained
