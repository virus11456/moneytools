"""NYSE-close scheduler; private state and atomic public releases on the VPS."""
import fcntl
import json
import os
import shutil
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
import pandas_market_calendars as mcal

CODE = Path('/opt/moneytools')
STATE = Path('/var/lib/moneytools/scan')
PUBLIC = Path('/var/www/moneytools-published')
sys.path.insert(0, str(CODE / 'scripts'))
sys.path.insert(0, str(CODE))


def due_session(now, completed):
    sessions = mcal.get_calendar('NYSE').schedule(
        start_date=(now - timedelta(days=7)).date(), end_date=now.date())
    due = [(str(day.date()), row['market_close'].to_pydatetime() + timedelta(minutes=75))
           for day, row in sessions.iterrows()
           if row['market_close'].to_pydatetime() + timedelta(minutes=75) <= now]
    if not due:
        return None
    day, target = due[-1]
    if day <= completed or now - target > timedelta(hours=12):
        return None
    return day


def publish():
    source = STATE / 'public/data'
    snapshot = json.loads((source / 'daily.json').read_text())
    if not snapshot.get('stocks') or not snapshot.get('generatedAt'):
        raise ValueError('Invalid daily snapshot; previous public release retained')
    release = PUBLIC / ('release-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
    release.mkdir(mode=0o755)
    release.chmod(0o755)
    for name in ('daily.json', 'history.json', 'market-calendar.json'):
        json.loads((source / name).read_text())
        shutil.copyfile(source / name, release / name)
        (release / name).chmod(0o644)
    snapshot.pop('lastObserved', None)
    snapshot.pop('gateObserved', None)
    (release / 'dashboard.json').write_text(json.dumps(snapshot, ensure_ascii=False, allow_nan=False, separators=(',', ':')))
    (release / 'dashboard.json').chmod(0o644)
    pending = PUBLIC / 'current-next'
    pending.unlink(missing_ok=True)
    pending.symlink_to(release.name)
    pending.replace(PUBLIC / 'current')


def main():
    STATE.mkdir(parents=True, exist_ok=True)
    with (STATE / 'scan.lock').open('w') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print('Another scan is running', flush=True)
            return
        if '--publish-only' in sys.argv:
            publish()
            return
        marker = STATE / 'completed-session.txt'
        day = due_session(datetime.now(timezone.utc), marker.read_text().strip() if marker.exists() else '')
        if not day:
            print('No new NYSE close due', flush=True)
            return
        import scan
        import update_universe
        from build_market_calendar import build
        scan.ROOT = STATE
        update_universe.ROOT = STATE
        # Preserve the real source without fabricating GitHub workflow identifiers.
        scan.scan_provenance = lambda env, started: {'trigger': 'scheduled', 'startedAt': started, 'runtime': 'vps', 'marketSession': day}
        scan.run()
        target = STATE / 'public/data/market-calendar.json'
        target.write_text(json.dumps(build(datetime.now(timezone.utc)), ensure_ascii=False))
        publish()
        pending = marker.with_suffix('.tmp')
        pending.write_text(day)
        pending.replace(marker)
        print('Published NYSE session ' + day, flush=True)

if __name__ == '__main__':
    main()
