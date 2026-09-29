# US macro series that stay missing

Reviewed 2026-09-29 for the Stocktools US macro dashboard. None of the six
series below is wired into `scripts/build_us_macro.py`. A source is published
only when it is legal to redistribute, can be refreshed by GitHub Actions
without a login or paid seat, and matches the named indicator. No history was
copied from news summaries, chart images, MacroMicro, or unofficial files.

Buckets:

- **Fully filled:** none.
- **Substitute only:** none. Nearby public series are already on the same
  charts or were rejected because they are a different indicator.
- **Still needs a paid license:** REDBOOK, ISM_PMI, ISM_NEWORDERS,
  ISM_SERVICES, NAAIM, NAAIM_MA20.

The builder still writes each id with `status: "missing"`, `substitute: false`,
`points: []`, and `latestDate: null`. The page shows 未取得, not 0.

## REDBOOK

| Field | Record |
| --- | --- |
| Official name | Johnson Redbook Index (weekly year-over-year same-store sales) |
| Site display name | Redbook 同店銷售 |
| Series id | `REDBOOK` |
| Source URL | https://www.redbookresearch.com/ |
| Publisher | Redbook Research Inc. |
| Frequency | Weekly (retail week, released Tuesday) |
| Unit | Percent, same-store sales versus the year-ago week |
| Earliest / latest / points in this repo | Not ingested. `points: []` |
| API key, login, or paid license | Paid subscription. Reports are subscriber PDFs, email, or fax. No public CSV, XLS, JSON, or API was found. |
| Terms | Redbook's own sample report says reproduction or redistribution is prohibited except with written permission. The index is described by the publisher as proprietary. |
| GitHub Actions / VPS auto-update | No. There is no unauthenticated file to poll, and republishing the series on stocktools.cc would be redistribution. |
| Identical to the chart's indicator | The chart slot is this index. It is not filled. |
| Latest-value check | No current machine-readable release is posted on the public site. A 2015 sample PDF is not a current value and was not stored. Census retail sales are not used as a stand-in. |

Rejected substitutes:

- FRED `RSAFS` and `MRTSSM4541USN` are already drawn on the retail chart. They are Census monthly sales, not a weekly same-store sample of about 9,000 general-merchandise stores. Different coverage, frequency, and seasonal basis.
- News headlines and CEIC tables are not a complete licensed history.

## ISM_PMI

| Field | Record |
| --- | --- |
| Official name | ISM Manufacturing PMI (Manufacturing PMI composite) |
| Site display name | 製造業 PMI |
| Series id | `ISM_PMI` |
| Source URL | https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/ |
| Publisher | Institute for Supply Management |
| Frequency | Monthly |
| Unit | Diffusion index. Above 50 means expansion. ISM reports the reading as a percent. |
| Earliest / latest / points in this repo | Not ingested. `points: []` |
| API key, login, or paid license | Historical file is a paid subscription (`pmireports@ismworld.org`). ISM announced paid history in 2014. No free official CSV/XLS/JSON/API for the full history. |
| Terms | ISM PMI content is licensed for personal, non-commercial display on the reader's own device. Copying, archiving, publishing, or building an index requires prior written permission. Requests go to ISM Research / `corpinfo@ismworld.org`. |
| FRED / ALFRED | On 2016-06-16 the St. Louis Fed said all 22 Manufacturing and Non-Manufacturing ISM series would be deleted from FRED, ALFRED, the API, and other FRED services on 2016-06-24, because ISM asked them to stop. Checked 2026-09-29: https://fred.stlouisfed.org/series/NAPM redirects to that notice. The series does not update. |
| GitHub Actions / VPS auto-update | No, not without a redistribution license. |
| Identical to the chart's indicator | The slot is the ISM composite, not a regional Fed survey and not S&P Global's PMI. |
| Latest-value check | ISM's August 2026 Manufacturing PMI write-up (Inside Supply Management, 9 September 2026) states the Manufacturing PMI registered **54.6 percent**. That single public headline was not written into `us-macro.json`. |

## ISM_NEWORDERS

| Field | Record |
| --- | --- |
| Official name | ISM Manufacturing New Orders Index |
| Site display name | 製造業新訂單 PMI |
| Series id | `ISM_NEWORDERS` |
| Source URL | Same ISM Report on Business page as `ISM_PMI` |
| Publisher | Institute for Supply Management |
| Frequency | Monthly |
| Unit | Diffusion index, same 50-line convention as the composite |
| Earliest / latest / points in this repo | Not ingested. `points: []` |
| API key, login, or paid license | Same paid ISM history subscription as the composite. |
| Terms | Same ISM PMI content license. New Orders is part of the report, not a separate public file. |
| FRED / ALFRED | Legacy id `NAPMNOI` redirects to the same 2016 removal notice. It does not update. |
| GitHub Actions / VPS auto-update | No. |
| Identical to the chart's indicator | Yes, this slot is Manufacturing New Orders, not Services New Orders and not Census durable-goods orders. |
| Latest-value check | The same August 2026 ISM manufacturing write-up states the New Orders Index registered **53.7 percent** (July was 56.7). Not stored. |

Census `DGORDER` and `NEWORDER` stay on the chart as official order dollars and year-over-year rates. They are shipments/orders in dollars, not a purchasing-manager diffusion index.

## ISM_SERVICES

| Field | Record |
| --- | --- |
| Official name | ISM Services PMI (formerly Non-Manufacturing NMI / Report on Business) |
| Site display name | 非製造業 PMI |
| Series id | `ISM_SERVICES` |
| Source URL | Same ISM Report on Business page |
| Publisher | Institute for Supply Management |
| Frequency | Monthly |
| Unit | Composite diffusion index of Business Activity, New Orders, Employment, and Supplier Deliveries |
| Earliest / latest / points in this repo | Not ingested. `points: []` |
| API key, login, or paid license | Same paid history subscription. ISM's historical product includes the non-manufacturing file and NMI. |
| Terms | The Services report carries the same ban on creating or distributing an index without written authorization. |
| FRED / ALFRED | Legacy ids cited for the non-manufacturing composite, including `NMFCI` and `NMFBAI`, redirect to the 2016 removal notice. They do not update. |
| GitHub Actions / VPS auto-update | No. |
| Identical to the chart's indicator | Yes. It is not the S&P Global services PMI. |
| Latest-value check | ISM's August 2026 Services PMI write-up (Inside Supply Management, 9 September 2026) states the Services PMI registered **55.4 percent**. July's public report stated **54.1 percent**. Neither number was stored. |

Rejected substitutes for all three ISM series:

- S&P Global (Markit) US PMI is a different panel and is itself proprietary.
- Empire State, Philadelphia, Richmond, Dallas, and Kansas City Fed surveys are free and updated, but they are regional and use their own respondents and seasonal factors. Putting one in an `ISM_*` id would present a different indicator as ISM.
- Industrial production (`INDPRO`) is a Federal Reserve output index, not a diffusion survey.

## NAAIM

| Field | Record |
| --- | --- |
| Official name | NAAIM Exposure Index |
| Site display name | 經理人曝險 |
| Series id | `NAAIM` |
| Source URL | https://naaim.org/programs/naaim-exposure-index/ |
| Publisher | National Association of Active Investment Managers |
| Frequency | Weekly, Wednesday close, averaged across responding member firms |
| Unit | Average reported U.S. equity exposure. The scale runs from -200 (leveraged short) to 200 (leveraged long). |
| Earliest / latest / points in this repo | Not ingested. `points: []` |
| API key, login, or paid license | Yes, as of 1 August 2026. Members get a login. Non-members need an annual subscription. Current values plus 20+ years of history, and API access, are paid. Redistribution requires the Program Partner subscription. |
| Terms | The public page says the figure shown there is delayed three months and is for viewing on that page. NAAIM reserves the index and its data, and says express permission is required for commercial use. The subscription terms say an organization that republishes the data must be a Program Partner, keep the attribution line, and not modify the data. |
| What the public page actually offers | No CSV, XLS, or JSON link. The page embeds `https://index.naaim.org/embeddable/number`, `/chart`, and `/table`. The chart and table were not downloaded. |
| GitHub Actions / VPS auto-update | No. Polling the embeds into this repo would republish the series. |
| Identical to the chart's indicator | The slot is this survey. It is not filled with another sentiment series. |
| Latest-value check | On 2026-09-29 the public number embed displayed **98.59** and did not print an observation date. The parent page says that display is delayed three months. The figure was not written into `us-macro.json`, and the 20-week average was not computed from it. |

## NAAIM_MA20

| Field | Record |
| --- | --- |
| Official name | 20-observation moving average of the NAAIM Exposure Index |
| Site display name | 20 週均線 |
| Series id | `NAAIM_MA20` |
| Source URL | Same NAAIM page. This average is not a separate NAAIM download. |
| Publisher | Would be computed by Stocktools only from a redistributable NAAIM history |
| Frequency | Weekly, once 20 consecutive observations exist |
| Unit | Same exposure units as `NAAIM` |
| Earliest / latest / points in this repo | Not ingested. `points: []` |
| API key, login, or paid license | Inherits the NAAIM license. There is no separate free average file. |
| Terms | A derived average of a series we cannot redistribute is still derived from that series. It is not published. |
| GitHub Actions / VPS auto-update | No upstream series to update. |
| Identical to the chart's indicator | It would be the 20-observation mean of raw NAAIM, restarting after a publication gap. It is not scraped from a chart image. |
| Latest-value check | Not computed. One public reading is not 20 consecutive observations, and that reading was not stored. |

`moving_average()` is covered by tests: it starts on the 20th consecutive observation, keeps ordinary weekend gaps in a daily series, and clears the window when a weekly gap exceeds 12 days. That function is not pointed at NAAIM while `NAAIM` is blocked.

## Pipeline rules that apply even though these six stay empty

- HTTP fetches use a timeout, three retries, and User-Agent `stocktools-macro-builder/1.0 (+https://stocktools.cc)`.
- Before writing `public/macro-data/us-macro.json`, the builder loads the live file at `https://stocktools.cc/macro-data/us-macro.json` and, if that fails, the previous local file. A failed or empty refresh keeps the previous points and their original dates. It does not stamp today's date and does not replace values with 0.
- A successful refresh merges by date. The new value wins on a date that both sides have, so revisions land, and older dates that the refresh did not return are kept.
- Series ids in `LICENSED_SERIES` are cleared even if a previous file contains points for them.
- Output is JSON with `allow_nan=False`. Dates are `YYYY-MM-DD`. Duplicate dates collapse to the last finite number. Gaps are not interpolated.
- The chart inserts a null break between observations farther apart than the series' normal spacing, and does not connect across that null. A null tooltip is an em dash, not 0. Ratios smaller than 0.01 keep four significant digits so a real value such as the copper/gold ratio is not rounded to 0 on the card.
