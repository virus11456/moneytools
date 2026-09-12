"""Refresh a public constituent list; validate before replacing the saved fallback."""
import csv, io, json, re
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv'
def refresh():
    try:
        request = Request(SOURCE, headers={'User-Agent': 'moneytools-personal-research'})
        with urlopen(request, timeout=30) as response:
            rows = list(csv.DictReader(io.StringIO(response.read().decode())))
        symbols = sorted({r['Symbol'].replace('.', '-') for r in rows})
        if not 450 <= len(symbols) <= 550 or any(not re.fullmatch(r'[A-Z]{1,6}(?:-[A-Z])?', s) for s in symbols):
            raise ValueError('Unexpected constituent list')
        extras = json.loads((ROOT/'watchlist.json').read_text())
        combined = sorted(set(symbols + extras))
        meta = dict(name='S&P 500 公開成分股名單＋原有觀察股', source=SOURCE,
                    retrievedAt=datetime.now(timezone.utc).isoformat(), constituentCount=len(symbols),
                    additionalCount=len(set(extras)-set(symbols)), warning='公開整理名單可能落後官方成分調整，並非全美股。')
        (ROOT/'universe.json').write_text(json.dumps(combined, indent=2)+'\n')
        (ROOT/'universe-meta.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2)+'\n')
        return meta
    except Exception as exc:
        meta = json.loads((ROOT/'universe-meta.json').read_text())
        return meta | dict(refreshWarning='本次名單更新失敗，沿用上次儲存名單。', refreshError=type(exc).__name__)
if __name__ == '__main__':
    print(json.dumps(refresh(), ensure_ascii=False))
