"""Reproducible 2026 regular-session calendar; renew against exchange notices annually.
Ad-hoc closures must be added after official confirmation; never infer future years.
"""
import json
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

SPECS = {
    'US': ('America/New_York', (9, 30), (16, 0),
           '01-01 01-19 02-16 04-03 05-25 06-19 07-03 09-07 11-26 12-25',
           {'11-27': (13, 0), '12-24': (13, 0)},
           'https://www.nyse.com/trade/hours-calendars'),
    'TW': ('Asia/Taipei', (9, 0), (13, 30),
           '01-01 02-12 02-13 02-16 02-17 02-18 02-19 02-20 02-27 04-03 04-06 05-01 06-19 09-25 09-28 10-09 10-26 12-25',
           {}, 'https://www.twse.com.tw/holidaySchedule/holidaySchedule?response=html'),
}

def build():
    result = {}
    for market, (zone, opening, closing, holidays, early, source) in SPECS.items():
        sessions = []
        day = date(2026, 1, 1)
        while day.year == 2026:
            key = day.strftime('%m-%d')
            if day.weekday() < 5 and key not in holidays.split():
                def instant(hm):
                    return datetime.combine(day, time(*hm), ZoneInfo(zone)).astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')
                sessions.append([instant(opening), instant(early.get(key, closing))])
            day += timedelta(days=1)
        result[market] = dict(timeZone=zone, fromDate='2026-01-01', throughDate='2026-12-31',
                              verifiedAt='2026-09-16', source=source, sessions=sessions)
    return result

if __name__ == '__main__':
    target = Path(__file__).resolve().parents[1] / 'app/calendars/trading-sessions.json'
    target.write_text(json.dumps(build(), ensure_ascii=False, separators=(',', ':')) + '\n')
