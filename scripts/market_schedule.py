"""Gate scheduled scans against NYSE session closes, including DST and early closes."""
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import os
import pandas_market_calendars as mcal


def decision(now, event='schedule', scheduled_cron=''):
    if event != 'schedule':
        return True, 'Manual or code-triggered refresh'
    if now.tzinfo is None:
        raise ValueError('Timezone-aware time required')
    market_day = now.astimezone(ZoneInfo('America/New_York')).date()
    sessions = mcal.get_calendar('NYSE').schedule(start_date=market_day, end_date=market_day)
    if sessions.empty:
        return False, f'{market_day}: exchange holiday or weekend'
    close = sessions.iloc[0]['market_close'].to_pydatetime()
    target = close + timedelta(minutes=75)
    target_utc = target.astimezone(timezone.utc)
    expected_cron = f'15 {target_utc.hour} * * 1-5'
    if scheduled_cron != expected_cron:
        return False, f'Inactive DST/early-close slot; target {target.isoformat()}'
    if now < target:
        return False, 'Before close + 75 minutes'
    return True, f'{market_day}: close {close.isoformat()}, refresh target {target.isoformat()}'


if __name__ == '__main__':
    run, reason = decision(datetime.now(timezone.utc), os.environ.get('SCAN_EVENT', 'workflow_dispatch'), os.environ.get('SCAN_CRON', ''))
    print(reason)
    with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
        output.write(f'run={str(run).lower()}\n')
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
            summary.write(f'### Market-close schedule\n{reason}\nScan: {run}\n')
