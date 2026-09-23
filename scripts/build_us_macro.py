#!/usr/bin/env python3
"""Build public US macro data from FRED CSV without an API key."""
from __future__ import annotations
import csv, io, json, math, subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public/macro-data/us-macro.json"
SERIES = {
 "ICSA":("level",.001),"CCSA":("level",.001),"PAYEMS":("change",1),
 "PCE":("yoy",1),"PI":("yoy",1),"PSAVERT":("level",1),
 "SPCS20RSA":("level",1),"MSPNHSUS":("level",.001),"HSN1F":("yoy",1),"EXHOSLUSM495S":("yoy",1),
 "TOTALSA":("level",1),"RSAFS":("yoy",1),"MRTSSM4541USN":("yoy",1),
 "HOUST":("yoy",1),"PERMIT":("yoy",1),"HOSINVUSM495N":("yoy",1),
 "DGORDER":("yoy",1),"NEWORDER":("yoy",1),"WEI":("level",1),"GDP":("yoy4",1),
 "PPIACO":("yoy",1),"CPIAUCSL":("yoy",1),"CPILFESL":("yoy",1),
 "FEDFUNDS":("level",1),"DGS2":("level",1),"DGS5":("level",1),"DGS10":("level",1),"USD3MTD156N":("level",1),
 "BAMLH0A3HYC":("level",1),"VIXCLS":("level",1),"SP500":("level",1),
}

def fetch(series: str):
    result=subprocess.run(["curl","--fail","--location","--silent","--show-error","--max-time","30",f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series}"],check=True,capture_output=True,text=True)
    raw=result.stdout
    rows=[]
    for row in csv.DictReader(io.StringIO(raw)):
        try: v=float(row.get(series,""))
        except (ValueError,TypeError): continue
        if math.isfinite(v): rows.append((row.get("observation_date") or row.get("DATE"),v))
    return rows

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

def main():
    data={"generatedAt":datetime.now(timezone.utc).isoformat(),"series":{}}
    def build_one(item):
        sid,(mode,scale)=item
        try:
            points=transform(fetch(sid),mode,scale)
            return sid,{"latestDate":points[-1]["date"] if points else None,"points":points}
        except Exception as exc:
            return sid,{"points":[],"error":f"{type(exc).__name__}: {exc}"}
    with ThreadPoolExecutor(max_workers=6) as pool:
        for future in as_completed([pool.submit(build_one,item) for item in SERIES.items()]):
            sid,result=future.result(); data["series"][sid]=result
    # Derived IDs let one source appear as a level and a YoY series without changing chart semantics.
    for source,derived in (("TOTALSA","TOTALSA_YOY"),("SPCS20RSA","SPCS20RSA_YOY")):
        try:
            points=transform(fetch(source),"yoy",1)
            data["series"][derived]={"latestDate":points[-1]["date"] if points else None,"points":points}
        except Exception as exc: data["series"][derived]={"points":[],"error":str(exc)}
    OUT.parent.mkdir(parents=True,exist_ok=True); OUT.write_text(json.dumps(data,separators=(",",":")),encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size/1024:.1f} KiB)")

if __name__ == "__main__": main()
