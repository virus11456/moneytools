# Moneytools — 美股雙重分析

A transparent, rule-based US-stock research dashboard with daily setup transitions and ticker/company lookup. No weighted recommendation score and no fabricated market data.

## Research flow

- **Fundamental:** latest complete fiscal year revenue ≥ USD 100M, year-over-year growth ≥ 15%, positive operating margin, operating cash flow and free cash flow. Fiscal dates are aligned across statements. USD financials only; financial services and real estate are excluded from these general-company rules.
- **Trend:** latest completed daily close > SMA50 > SMA200; both averages higher than 20 trading days earlier; 20-day average dollar volume ≥ USD 10M. Annualized regression slope is descriptive only.
- **Entry:** 126 trading days, 24 volume-by-price bins. Each day's entire volume is assigned to its typical-price bin. The closest bin under price with ≥ 50% of peak volume defines a potential support zone. This is a coarse daily approximation, not investor holdings or tick-level volume profile.
- **Confirmation:** close above previous high, volume ≥ previous 20-day average, daily low touches zone while close holds the lower boundary.
- **Risk:** invalidation = lower zone edge − 0.5 × ATR14. Reference target = previous 63-day high. Reward/risk uses latest close; target must exceed price and invalidation must be positive and below price. Fees, gap risk and slippage are not modeled.

`READY` requires all quality and trend gates, distance ≤ 2%, all confirmations and reward/risk ≥ 2. `APPROACHING` requires quality, trend and distance ≤ 5%, with readiness still unconfirmed. `QUALITY` means quality passes while trend or location needs patience. `WAIT` means quality fails. `INCOMPLETE` means missing, stale or unsupported data. Price freshness is 5 calendar days; annual financial freshness is 550 days. Business model, moat and valuation still require human research. This strategy is not backtested.

## Daily changes and all qualifying stocks

`public/data/daily.json` stores the latest scan, last valid observed state per symbol and today's transitions. `public/data/previous.json` preserves the preceding snapshot; Git commit history provides durable history. The initial scan and newly added symbols establish a baseline, not a new opportunity. Qualifying category changes count as new entries only when the price date or fiscal period also advances. Reruns preserve same-day events, the next Taipei day clears them, and a stale browser snapshot cannot show yesterday's events as today's. Failed/incomplete fetches do not reset known state. A method-version change rebuilds the baseline. No invented backtest or previous-day financial data is used.

`.github/workflows/daily-scan.yml` starts 75 minutes after the NYSE core session closes, using `pandas_market_calendars` 5.4.0 to skip holidays/weekends and account for DST and 13:00 early closes. Four UTC candidate slots are gated by `scripts/market_schedule.py`; only the slot matching the session close runs a scan. A delayed matching trigger remains eligible on the same New York date. Normal sessions target 17:15 New York (05:15 Taipei in US daylight time / 06:15 in standard time), also supports manual dispatch, runs tests, refreshes a validated public S&P 500 constituent list, merges the editable `watchlist.json`, and scans the resulting `universe.json` sequentially with 1.5-second pacing and a 5-second pause every 25 requests, and commits the snapshot back to `main`. GitHub schedules and Vercel builds can be delayed. A fully failed scan fails without overwriting the prior snapshot; partial failures are explicitly shown. The workflow has only repository contents write access and uses the built-in token. Vercel's Git integration deploys branch pushes; no extra paid data subscription is required. Deployment status should be checked after the first automated run.

## Search and pages

Search accepts ticker or English company name. Yahoo search returns matching US equity listings. `/stock/NVDA` is a direct analysis route. Scanned symbols use the dated daily snapshot; unscanned symbols call `/api/analyze?symbol=...`. API results may be cached for up to two hours and always carry fetch/price/fiscal timestamps. Lookup alone does not add a symbol to the daily universe. Invalid tickers and upstream failures return explicit errors.

## Run locally

Node 22.13+ and Python 3.12+ are required.

```sh
pnpm install --frozen-lockfile
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt -r requirements-schedule.txt
.venv/bin/python scripts/scan.py
.venv/bin/python scripts/dev_api.py
# In another terminal:
pnpm dev
```

```sh
python3 -m unittest discover -s tests -v
pnpm build
```

## Vercel

Import `virus11456/moneytools`, keep root directory `./`, framework Vite, `pnpm build`, and output `dist`. Python handlers under `api/` deploy beside the static frontend. No API key is required. The repository stays private; the deployed dashboard contains public market research data and no account or trading data.

## Recovery and historical records

Same-Taipei-day results fetched less than six hours ago can be reused only if their price date matches the latest expected completed weekday session and no fundamental checks are missing. Original timestamps remain unchanged. Remaining symbols are requested sequentially. A rate-limit response stops the whole pass, with 45/90-second cooldowns before subsequent passes; persistent limits stop further requests rather than hammering the provider. Only unresolved symbols are retried, at most three passes. `recovery` reports request/reuse/retry outcomes. Market holidays may cause extra fetches, never false freshness.

`retainedStocks` holds dated previous records for unresolved symbols, recovered from the preceding snapshots if available. They are separate from `stocks`, coverage, qualifying totals and new-today events. A failure does not imply fundamental deterioration. The UI displays previously qualifying retained records in a clearly labeled pending-data section, and displays a historical-data notice when opening them. No old timestamp is rewritten to pretend the data is new. API-on-demand lookup remains subject to the provider's rate limits.

## Sources and limitations

- [yfinance documentation](https://ranaroussi.github.io/yfinance/) — unofficial Yahoo Finance wrapper; upstream availability, timeliness and permitted usage are not guaranteed. Intended here for personal research.
- [Vercel Git integration](https://vercel.com/docs/git/vercel-for-github)
- [GitHub scheduled events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [Original framework video](https://www.youtube.com/watch?v=qbU7LHPZ4Xo)

The dashboard scans the public S&P 500 constituent list plus the original watchlist, not the entire US market. `universe-meta.json` records the source and retrieval time. A failed list refresh uses the validated saved list and displays a warning. The public list may lag official index changes. Annual financial statements lag company developments; price data is completed daily data, not live quotes. Free sources may delay, omit, revise or rate-limit data. Volume profile support is a hypothesis that can fail. These labels are research conditions, not personalized investment advice or trade orders.

All fundamental matches remain visible in two disjoint groups. Every card displays all financial and trend checks with values, thresholds and source dates, plus entry checks. `today` labels only newly passing fundamental or dual gates on the current Taipei day. A READY/APPROACHING change alone is shown as an entry change, not a new gate match. `dailyChanges` and `gateObserved` track additions, dual upgrades and confirmed losses independently of entry status; incomplete data never generates a loss. First observations establish a baseline without fabricating when a stock first qualified. Migration seeds gates from real prior snapshot results. Same-day reruns preserve still-applicable events.
