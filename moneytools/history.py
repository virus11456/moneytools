"""Thirty-day observed transition log, independent of today's net-change labels."""
from copy import deepcopy
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from .state import daily_changes
from .setup import VERSION


def append_history(history, previous, stocks, errors, generated_at):
    day = datetime.fromisoformat(generated_at).astimezone(ZoneInfo('Asia/Taipei')).date()
    cutoff = (day - timedelta(days=29)).isoformat()
    compatible = history.get('methodVersion') == VERSION and history.get('version') == 1
    old = deepcopy(history) if compatible else {}
    events = [e for e in old.get('events', []) if cutoff <= e['scanDate'] <= day.isoformat()]
    # Clear the daily net-event origin: history records each observed transition,
    # including reversals later on the same day. Missing data never emits an exit.
    origin = dict(previous or {}, scanDate=None, dailyChanges=[])
    changes = daily_changes(origin, stocks, errors, generated_at)['dailyChanges']
    for event in changes:
        event = deepcopy(event)
        event['scanDate'] = day.isoformat()
        # Checks are already represented by conditionChanges; avoid duplicating all checks.
        for side in ('before', 'after'):
            event[side] = {k:v for k,v in event[side].items() if k != 'checks'}
        events.append(event)
    dates = {d['date']:d for d in old.get('days', []) if cutoff <= d['date'] <= day.isoformat()}
    dates[day.isoformat()] = dict(date=day.isoformat(), scannedAt=generated_at,
        observed=sorted(s['symbol'] for s in stocks if s['status'] != 'INCOMPLETE'),
        unavailable=sorted({s['symbol'] for s in stocks if s['status'] == 'INCOMPLETE'} | {e['symbol'] for e in errors}))
    return dict(version=1, methodVersion=VERSION, startedAt=old.get('startedAt', generated_at),
                updatedAt=generated_at, events=events, days=sorted(dates.values(), key=lambda d:d['date']))
