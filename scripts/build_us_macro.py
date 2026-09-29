#!/usr/bin/env python3
"""Build public US macro data from auditable public sources.

FRED remains the primary source.  CFTC data and market-price-derived series are
added only when their exact source and formula can be disclosed on the site.
Unavailable licensed surveys remain absent instead of being approximated.
"""
from __future__ import annotations
import csv, io, json, math, re, subprocess, zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public/macro-data/us-macro.json"
PUBLISHED_URL = "https://stocktools.cc/macro-data/us-macro.json"
USER_AGENT = "stocktools-macro-builder/1.0 (+https://stocktools.cc)"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
# Survey series with no legal, complete, auto-updating redistribution path.
# They are written as empty on purpose. Do not fill them from a baseline file.
LICENSED_SERIES = {
 "REDBOOK": "Johnson Redbook 同店銷售為專有週資料，官方未提供可再散布的完整歷史，不能用新聞或普查零售代替。",
 "ISM_PMI": "ISM 製造業 PMI 為專有調查。FRED NAPM 已於 2016-06-24 應 ISM 要求刪除，未取得再散布授權前不發布。",
 "ISM_NEWORDERS": "ISM 製造業新訂單指數為專有調查。FRED NAPMNOI 已隨 ISM 序列刪除，未取得再散布授權前不發布。",
 "ISM_SERVICES": "ISM 服務業（非製造業）PMI 為專有調查。FRED 已刪除全部 ISM 序列，未取得再散布授權前不發布。",
 "NAAIM": "NAAIM 曝險指數自 2026-08-01 起需訂閱；公開頁禁止未經許可的商業再散布，不抓取圖表或表格。",
 "NAAIM_MA20": "20 期均線只能源自可再散布的 NAAIM 原始序列。目前沒有該序列，因此不計算、不手填、不從圖片描點。",
}
SERIES = {
 "ICSA":("level",.001),"CCSA":("level",.001),"PAYEMS":("change",1),
 "PCE":("yoy",1),"PI":("yoy",1),"PSAVERT":("level",1),
 "SPCS20RSA":("level",1),"MSPNHSUS":("level",.001),"HSN1F":("yoy",1),"EXHOSLUSM495S":("yoy",1),
 "TOTALSA":("level",1),"RSAFS":("yoy",1),"MRTSSM4541USN":("yoy",1),
 "HOUST":("yoy",1),"PERMIT":("yoy",1),"HOSINVUSM495N":("yoy",1),
 "DGORDER":("yoy",1),"NEWORDER":("yoy",1),"WEI":("level",1),"GDP":("yoy4",1),
 "PPIFIS":("yoy",1),"CPIAUCSL":("yoy",1),"CPILFESL":("yoy",1),
 "FEDFUNDS":("level",1),"DGS2":("level",1),"DGS5":("level",1),"DGS10":("level",1),"USD3MTD156N":("level",1),
 "BAMLH0A3HYC":("level",1),"VIXCLS":("level",1),"SP500":("level",1),
}

MARKET_SYMBOLS = {
 "COPPER": "HG=F", "GOLD": "GC=F", "OIL": "CL=F", "NDX": "^NDX",
 "VTI": "VTI", "VOX": "VOX", "VCR": "VCR", "VDC": "VDC",
 "VDE": "VDE", "VFH": "VFH", "VHT": "VHT", "VIS": "VIS",
 "VAW": "VAW", "VNQ": "VNQ", "VGT": "VGT", "VPU": "VPU",
}
SECTOR_ETFS = ("VOX", "VCR", "VDC", "VDE", "VFH", "VHT", "VIS", "VAW", "VNQ", "VGT", "VPU")
CFTC_CODES = {"SP500_COT": "13874+", "NASDAQ_COT": "20974+"}

def http_get(url: str, timeout: int = 45) -> bytes:
    """GET with a timeout, retries, and an identifying User-Agent."""
    result = subprocess.run(
        [
            "curl", "--fail", "--location", "--silent", "--show-error",
            "--retry", "3", "--retry-delay", "1", "--retry-all-errors",
            "--max-time", str(timeout), "--user-agent", USER_AGENT, url,
        ],
        check=False, capture_output=True,
    )
    if result.returncode != 0:
        detail = (result.stderr or b"").decode("utf-8", "replace").strip()
        raise RuntimeError(detail or f"curl exit {result.returncode}")
    return result.stdout

def fetch(series: str):
    raw = http_get(f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series}", timeout=90).decode("utf-8", "replace")
    rows=[]
    for row in csv.DictReader(io.StringIO(raw)):
        try: v=float(row.get(series,""))
        except (ValueError,TypeError): continue
        if math.isfinite(v): rows.append((row.get("observation_date") or row.get("DATE"),v))
    return rows

def fetch_bytes(url: str, timeout: int = 90) -> bytes:
    return http_get(url, timeout=timeout)

def transform(rows, mode, scale):
    lag=4 if mode=="yoy4" else 12
    out=[]
    for i,(date,value) in enumerate(rows):
        if mode=="change":
            if i<1: continue
            value=value-rows[i-1][1]
        elif mode in ("yoy","yoy4"):
            if i<lag or rows[i-lag][1]==0: continue
            value=(value/rows[i-lag][1]-1)*100
        out.append({"date":date,"value":round(value*scale,4)})
    # Keep twenty-five years and thin daily series to Friday/last observation per week.
    cutoff="2000-01-01"; out=[p for p in out if p["date"]>=cutoff]
    if len(out)>2500:
        weekly={}
        for p in out:
            d=datetime.fromisoformat(p["date"]); weekly[f"{d.isocalendar().year}-{d.isocalendar().week:02}"]=p
        out=list(weekly.values())
    return out

def points_result(points):
    return {"latestDate": points[-1]["date"] if points else None, "points": points}

def ratio_points(numerator, denominator):
    """Return a same-day price ratio without forward-filling either market."""
    den = {date: value for date, value in denominator if value and math.isfinite(value)}
    points = [
        {"date": date, "value": round(value / den[date], 6)}
        for date, value in numerator
        if date in den and den[date] and math.isfinite(value)
    ]
    return thin_points(points)

def thin_points(points):
    points = [p for p in points if p["date"] >= "2000-01-01" and math.isfinite(p["value"])]
    if len(points) <= 2500:
        return points
    weekly = {}
    for point in points:
        date = datetime.fromisoformat(point["date"])
        weekly[f"{date.isocalendar().year}-{date.isocalendar().week:02}"] = point
    return list(weekly.values())

def fetch_market_series():
    """Download adjusted closes once, then derive all transparent market ratios."""
    import yfinance as yf

    requested = list(MARKET_SYMBOLS.values())
    frame = yf.download(
        requested, start="2000-01-01", auto_adjust=True, progress=False,
        group_by="ticker", threads=True,
    )
    prices = {}
    for key, symbol in MARKET_SYMBOLS.items():
        try:
            close = frame[symbol]["Close"] if len(requested) > 1 else frame["Close"]
            rows = []
            for index, value in close.dropna().items():
                number = float(value)
                if math.isfinite(number):
                    rows.append((index.strftime("%Y-%m-%d"), number))
            prices[key] = rows
        except Exception:
            prices[key] = []

    output = {
        "COPPER_GOLD": points_result(ratio_points(prices["COPPER"], prices["GOLD"])),
        "OIL_GOLD": points_result(ratio_points(prices["OIL"], prices["GOLD"])),
        "NDX": points_result(thin_points([{"date": date, "value": round(value, 4)} for date, value in prices["NDX"]])),
    }
    for symbol in SECTOR_ETFS:
        output[f"{symbol}_VTI"] = points_result(ratio_points(prices[symbol], prices["VTI"]))
    return output

def fetch_breadth_series():
    """Calculate current-constituent S&P 500 breadth with an explicit bias note in UI."""
    import yfinance as yf

    raw = fetch_bytes("https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv").decode("utf-8-sig")
    tickers = []
    for row in csv.DictReader(io.StringIO(raw)):
        symbol = (row.get("Symbol") or "").strip().replace(".", "-")
        if symbol:
            tickers.append(symbol)
    if len(tickers) < 450:
        raise ValueError(f"S&P 500 constituent list unexpectedly short: {len(tickers)}")
    frame = yf.download(
        tickers, start="2015-01-01", auto_adjust=True, progress=False,
        group_by="column", threads=True,
    )
    close = frame["Close"]
    output = {}
    for window, series_id in ((50, "SPX_ABOVE_50"), (200, "SPX_ABOVE_200")):
        average = close.rolling(window=window, min_periods=window).mean()
        eligible = close.notna() & average.notna()
        denominator = eligible.sum(axis=1)
        ratio = ((close > average) & eligible).sum(axis=1).div(denominator.where(denominator > 0)).mul(100).dropna()
        points = [
            {"date": index.strftime("%Y-%m-%d"), "value": round(float(value), 4)}
            for index, value in ratio.items() if math.isfinite(float(value))
        ]
        output[series_id] = points_result(thin_points(points))
    return output

def parse_cftc_zip(payload: bytes):
    """Parse TFF futures-only leveraged-money net positions by contract code."""
    output = {series_id: {} for series_id in CFTC_CODES}
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        filename = archive.namelist()[0]
        with archive.open(filename) as raw:
            rows = csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8-sig", errors="replace"))
            for row in rows:
                code = (row.get("CFTC_Contract_Market_Code") or "").strip()
                for series_id, wanted_code in CFTC_CODES.items():
                    if code != wanted_code:
                        continue
                    try:
                        long_value = float(row["Lev_Money_Positions_Long_All"])
                        short_value = float(row["Lev_Money_Positions_Short_All"])
                    except (KeyError, TypeError, ValueError):
                        continue
                    raw_date = row.get("Report_Date_as_YYYY-MM-DD", "").strip()
                    date = None
                    for pattern in ("%Y-%m-%d", "%m/%d/%Y %I:%M:%S %p", "%m/%d/%Y"):
                        try:
                            date = datetime.strptime(raw_date, pattern).strftime("%Y-%m-%d")
                            break
                        except ValueError:
                            pass
                    if date:
                        output[series_id][date] = long_value - short_value
    return output

def fetch_cftc_series():
    combined = {series_id: {} for series_id in CFTC_CODES}
    urls = ["https://www.cftc.gov/files/dea/history/fin_fut_txt_2006_2016.zip"]
    urls.extend(
        f"https://www.cftc.gov/files/dea/history/fut_fin_txt_{year}.zip"
        for year in range(2017, datetime.now(timezone.utc).year + 1)
    )
    errors = []
    for url in urls:
        try:
            parsed = parse_cftc_zip(fetch_bytes(url))
            for series_id, values in parsed.items():
                combined[series_id].update(values)
        except Exception as exc:
            errors.append(f"{url.rsplit('/', 1)[-1]}: {type(exc).__name__}")
    output = {}
    for series_id, values in combined.items():
        points = [{"date": date, "value": round(value, 4)} for date, value in sorted(values.items())]
        output[series_id] = points_result(points)
        if not points and errors:
            output[series_id]["error"] = "; ".join(errors)
    return output

def coerce_number(value):
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, (int, float)):
        number = float(value)
    elif isinstance(value, str):
        text = value.strip().replace(",", "")
        if not text or text.upper() in {"NA", "N/A", ".", "NULL", "NONE"}:
            return None
        try:
            number = float(text)
        except ValueError:
            return None
    else:
        return None
    return number if math.isfinite(number) else None

def normalize_points(rows):
    """Dedupe dates, sort ascending, and drop non-finite or non-dated rows.

    A changed file shape yields an empty list. Nothing is interpolated.
    """
    if not isinstance(rows, list):
        return []
    by_date = {}
    for row in rows:
        if isinstance(row, dict):
            raw_date = row.get("date") or row.get("observation_date") or row.get("DATE")
            raw_value = row.get("value")
            if raw_value is None and raw_date is not None:
                extras = [item for key, item in row.items() if key not in {"date", "observation_date", "DATE"}]
                raw_value = extras[0] if len(extras) == 1 else None
        elif isinstance(row, (list, tuple)) and len(row) >= 2:
            raw_date, raw_value = row[0], row[1]
        else:
            continue
        if not isinstance(raw_date, str) or not DATE_RE.match(raw_date.strip()[:10]):
            continue
        number = coerce_number(raw_value)
        if number is None:
            continue
        by_date[raw_date.strip()[:10]] = number
    return [{"date": date, "value": by_date[date]} for date in sorted(by_date)]

def gap_limit_days(points):
    """Calendar days after which a hole is a missed publication, not a weekend."""
    if len(points) < 3:
        return None
    deltas = []
    for prev, point in zip(points, points[1:]):
        deltas.append((datetime.fromisoformat(point["date"]) - datetime.fromisoformat(prev["date"])).days)
    deltas.sort()
    median = deltas[len(deltas) // 2]
    if median <= 5:
        return 11
    if median <= 12:
        return 12
    if median <= 40:
        return 50
    return max(int(median * 1.5), median + 1)

def long_gap_breaks(points):
    """Dates that must not be connected to the previous observation."""
    limit = gap_limit_days(points)
    if limit is None:
        return []
    breaks = []
    for prev, point in zip(points, points[1:]):
        delta = (datetime.fromisoformat(point["date"]) - datetime.fromisoformat(prev["date"])).days
        if delta > limit:
            breaks.append(point["date"])
    return breaks

def moving_average(points, window):
    """Simple trailing average that restarts after a long publication gap."""
    points = normalize_points(points)
    limit = gap_limit_days(points)
    values = []
    output = []
    previous = None
    for point in points:
        if previous is not None and limit is not None:
            delta = (datetime.fromisoformat(point["date"]) - datetime.fromisoformat(previous["date"])).days
            if delta > limit:
                values = []
        previous = point
        values.append(point["value"])
        if len(values) > window:
            values.pop(0)
        if len(values) == window:
            output.append({"date": point["date"], "value": round(sum(values) / window, 6)})
    return output

def missing_record(series_id):
    return {
        "latestDate": None,
        "points": [],
        "status": "missing",
        "substitute": False,
        "reason": LICENSED_SERIES[series_id],
    }

def release_observation_series(series_id, rows):
    """Publish parsed rows only when the series is not license-blocked."""
    if series_id in LICENSED_SERIES:
        return missing_record(series_id)
    return points_result(normalize_points(rows))

def parse_macro_payload(raw):
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8", "replace")
    payload = json.loads(raw)
    if not isinstance(payload, dict) or not isinstance(payload.get("series"), dict):
        raise ValueError("macro payload missing series")
    return payload

def load_published_baseline(fetch_url=http_get, path: Path = OUT):
    """Restore the last good publish. The live site wins; the local file is fallback."""
    try:
        return parse_macro_payload(fetch_url(PUBLISHED_URL, 60))["series"]
    except Exception as exc:
        print(f"warning: live macro baseline unavailable: {type(exc).__name__}: {exc}")
    if path.exists():
        try:
            return parse_macro_payload(path.read_text(encoding="utf-8"))["series"]
        except Exception as exc:
            print(f"warning: local macro baseline unreadable: {type(exc).__name__}: {exc}")
    return {}

def merge_one(new, old):
    """Keep prior observations when a refresh fails. Never invent today's date."""
    old_points = normalize_points(old.get("points") if isinstance(old, dict) else None)
    new_points = normalize_points(new.get("points") if isinstance(new, dict) else None)
    failed = not isinstance(new, dict) or bool(new.get("error")) or not new_points
    if failed:
        if old_points:
            record = {"latestDate": old_points[-1]["date"], "points": old_points, "preserved": True}
            if isinstance(new, dict) and new.get("error"):
                record["error"] = str(new["error"])[:500]
            return record
        if isinstance(new, dict) and new.get("error"):
            return {"latestDate": None, "points": [], "error": str(new["error"])[:500]}
        return {"latestDate": None, "points": []}
    combined = {point["date"]: point["value"] for point in old_points}
    for point in new_points:
        combined[point["date"]] = point["value"]
    points = [{"date": date, "value": combined[date]} for date in sorted(combined)]
    return {"latestDate": points[-1]["date"], "points": points}

def merge_published(built, baseline):
    output = {}
    for key in list(baseline) + [key for key in built if key not in baseline]:
        if key in LICENSED_SERIES:
            continue
        output[key] = merge_one(built.get(key), baseline.get(key))
    for key in LICENSED_SERIES:
        output[key] = missing_record(key)
    return output

def fetch_cboe_put_call():
    """Load the official public Cboe history (currently ending in 2019)."""
    raw = fetch_bytes("https://cdn.cboe.com/resources/options/volume_and_call_put_ratios/equitypc.csv").decode("utf-8-sig", "replace")
    header = raw.find("DATE,CALL,PUT,TOTAL,P/C Ratio")
    if header < 0:
        raise ValueError("Cboe equity put/call header not found")
    points = []
    for row in csv.DictReader(io.StringIO(raw[header:])):
        try:
            date = datetime.strptime(row["DATE"].strip(), "%m/%d/%Y").strftime("%Y-%m-%d")
            value = float(row["P/C Ratio"])
        except (KeyError, TypeError, ValueError):
            continue
        if math.isfinite(value):
            points.append({"date": date, "value": value})
    return {
        "CBOE_PC": points_result(points),
        "CBOE_PC_MA20": points_result(moving_average(points, 20)),
    }

def main():
    baseline = load_published_baseline()
    data={"generatedAt":datetime.now(timezone.utc).isoformat(),"series":{}}
    def build_one(item):
        sid,(mode,scale)=item
        try:
            points=transform(fetch(sid),mode,scale)
            return sid,points_result(points)
        except Exception as exc:
            return sid,{"points":[],"error":f"{type(exc).__name__}: {exc}"}
    with ThreadPoolExecutor(max_workers=6) as pool:
        for future in as_completed([pool.submit(build_one,item) for item in SERIES.items()]):
            sid,result=future.result(); data["series"][sid]=result
    # Derived IDs let one source appear as a level and a YoY series without changing chart semantics.
    for source,derived in (("TOTALSA","TOTALSA_YOY"),("SPCS20RSA","SPCS20RSA_YOY")):
        try:
            points=transform(fetch(source),"yoy",1)
            data["series"][derived]=points_result(points)
        except Exception as exc: data["series"][derived]={"points":[],"error":str(exc)}
    for builder in (fetch_market_series, fetch_cftc_series, fetch_breadth_series):
        try:
            data["series"].update(builder())
        except Exception as exc:
            print(f"warning: {builder.__name__} failed: {type(exc).__name__}: {exc}")
    data["series"] = merge_published(data["series"], baseline)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(data,separators=(",",":"),allow_nan=False),encoding="utf-8")
    for series_id in LICENSED_SERIES:
        record = data["series"][series_id]
        print(f"{series_id}: status={record['status']} points={len(record['points'])} substitute={record['substitute']}")
    print(f"wrote {OUT} ({OUT.stat().st_size/1024:.1f} KiB)")

if __name__ == "__main__": main()
