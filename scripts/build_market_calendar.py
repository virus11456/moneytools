"""Publish bounded exchange-session dates for the browser; no guessed weekday calendar."""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo
import pandas_market_calendars as mcal


def build(now):
    day = now.astimezone(ZoneInfo('America/New_York')).date()
    start, end = day - timedelta(days=10), day + timedelta(days=60)
    schedule = mcal.get_calendar('NYSE').schedule(start_date=start, end_date=end)
    sessions = []
    for date, row in schedule.iterrows():
        close = row['market_close'].to_pydatetime()
        sessions.append(dict(date=date.date().isoformat(), closeAt=close.isoformat(),
                             scanAt=(close + timedelta(minutes=75)).isoformat()))
    return dict(generatedAt=now.isoformat(), fromDate=start.isoformat(), throughDate=end.isoformat(),
                source='NYSE / pandas_market_calendars 5.4.0', sessions=sessions)


if __name__ == '__main__':
    target = Path(__file__).resolve().parents[1] / 'public/data/market-calendar.json'
    target.write_text(json.dumps(build(datetime.now(timezone.utc)), ensure_ascii=False))
