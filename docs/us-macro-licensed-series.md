# US macro series that stay missing

Reviewed 2026-09-29 for the Stocktools US macro dashboard. None of the six
series below is wired into `scripts/build_us_macro.py`. A source is published
only when it is legal to redistribute, can be refreshed by GitHub Actions
without a login or paid seat, and matches the named indicator. No history was
copied from news summaries, chart images, MacroMicro, or unofficial files.

Buckets:

- **Fully filled:** none.
- **Substitute only:** none. Public regional Fed surveys and Census retail
  sales were checked on 2026-09-29. They are a different indicator, so they
  are not drawn in these six slots and are not labeled as substitutes.
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

Rejected substitutes: see [Substitutes checked on 2026-09-29](#substitutes-checked-on-2026-09-29). Census monthly retail sales stay on the retail chart under their own names. They are not labeled as Redbook.

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

Rejected substitutes for all three ISM series are recorded in [Substitutes checked on 2026-09-29](#substitutes-checked-on-2026-09-29). None is written into an `ISM_*` id.

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

## Licensing paths

Checked 2026-09-29. "Public redistribution" below means only what that organization's own page says about posting the series on a public website. A vendor page that never names the series is not treated as a yes or a no for that series.

MacroMicro is a paid option only. It is not called and its charts are not scraped. The API documentation is at https://en.macromicro.me/access-api/documentation. On https://en.macromicro.me/subscribe the API Essential plan is described as historical API access "to meet internal research and development needs." The same page says the Custom plan "provides complete commercial licensing, allowing the use of data, charts, and reports for commercial purposes," and its data-licensing line lists "internal research, business decision-making, investment analysis, public presentations, and more." The same FAQ says exclusive MacroMicro indicators are available for download or API integration only on the Custom plan, and "some data provided by MacroMicro's data partners cannot be offered for download or API access due to contractual limitations." The API Essential FAQ also says MacroMicro does not permit data from subscription plans to be used for commercial profit, and that provider agreements prohibit re-licensing, transfer, sale, loan, or distribution. Nothing on that page names Redbook, ISM, or NAAIM, so Custom is not treated here as a license those publishers have already granted.

### REDBOOK

| Path | What the page says about public redistribution |
| --- | --- |
| Redbook Research (https://www.redbookresearch.com/) | Paid subscriber reports (PDF, email, or fax). The publisher's sample report says reproduction or redistribution is prohibited except with written permission. That is a no, unless Redbook gives written permission. |
| Haver Analytics | No Haver page reviewed names the Johnson Redbook Index or says a subscriber may post it on a public website. Haver articles that mention ISM describe delivery inside Haver databases, not a public-redistribution right. |
| LSEG | The Eikon .NET API page (https://developers.lseg.com/en/api-catalog/eikon/-net-apis-for-use-in-custom-applications) says: "The Refinitiv Eikon end user license agreement prohibits any type of data redistribution." It points redistribution to a separate platform product. That page does not name Redbook. LSEG's redistribution product page (https://www.lseg.com/en/data-analytics/market-data/data-redistribution) describes real-time, pricing, reference, tick history, and news, and says delivering data to a firm's customers is redistribution that still needs a license. It does not say Redbook may be posted on a public site. |
| Bloomberg | The Data License page retrieved at https://professional.bloomberg.com/products/data/data-license/ describes an enterprise content catalog. The text retrieved does not say public website redistribution of Redbook is allowed. |
| Trading Economics | https://tradingeconomics.com/api/ says the API "can be used to feed a custom developed application, a public website" and that price depends on features, request volume, and "the distribution you make." The page does not say Redbook is included, and it does not say Redbook authorized that redistribution. |
| MacroMicro | Paid option only, as above. Not used. |

### ISM_PMI, ISM_NEWORDERS, ISM_SERVICES

| Path | What the page says about public redistribution |
| --- | --- |
| ISM data license | Historical Manufacturing and Services files are a paid subscription. The 12 February 2014 ISM announcement said annual access was expected to cost $2,500 and that history reached as far as 1948; the contact given then was `kcahill@ism.ws`. Current report pages point historical purchases to `pmireports@ismworld.org`. ISM's PMI content notice grants a limited license to display the content on the reader's own device for personal, non-commercial use, and says the reader shall not copy, archive, publish, or otherwise use the content except as explicitly allowed in writing. It also says the reader shall not create, recreate, distribute, or advertise an index without prior written authorization. Requests go to ISM Research or `corpinfo@ismworld.org` / `kcahill@ismworld.org` with subject "Content Request." That is a no for this public site unless ISM gives written authorization. |
| Haver Analytics | Haver articles state that ISM figures "can be found in Haver's USECON database; further detail is found in the SURVEYS database." Those articles do not say a Haver subscriber may republish the series on a public website. |
| LSEG | Same Eikon sentence as above: the Eikon end user license "prohibits any type of data redistribution." The redistribution product page does not name ISM or grant a public-website right for it. |
| Bloomberg | The Data License page retrieved does not say public website redistribution of ISM is allowed. |
| Trading Economics | The API page allows a paid feed into a public website, with price set by the distribution. It does not say ISM authorized customers to republish ISM series. |
| MacroMicro | Paid option only. Partner series can be excluded by contract. Not used. |

### NAAIM and NAAIM_MA20

| Path | What the page says about public redistribution |
| --- | --- |
| NAAIM public page (https://naaim.org/programs/naaim-exposure-index/) | The figure on that page is delayed three months. "Express permission must be sought from NAAIM for use of this data for commercial purposes." That page alone is a no. |
| NAAIM Program Partner (https://members.naaim.org/ap/Membership/Application/GrZAe6L1) | "Organizations that intend to incorporate the NAAIM Exposure Index data into their platform, redistribute or republish the data, or resell or provide the data to customers or other third parties must subscribe as a Program Partner." The same terms say subscribers "are granted permission to republish and redistribute" the data, including through commercial platforms, if the content includes: `Source: NAAIM Exposure Index® (National Association of Active Investment Managers).` The data "may not be modified or presented in a manner that misrepresents the information." So the Program Partner page does allow public redistribution, with attribution and without modifying the data. This repo does not have that subscription. `NAAIM_MA20` is a derived average, which the same sentence may treat as a modification, so it is not computed from a Program Partner feed until that point is allowed in writing. |
| NAAIM members | The public page says current members keep complimentary login access. The Program Partner text is the one that grants redistribution. Member access is not treated as permission to post the series here. |
| Haver, LSEG, Bloomberg, Trading Economics | No page reviewed names the NAAIM Exposure Index or says that vendor's customer may post it on a public website. LSEG's Eikon page still prohibits redistribution of Eikon data. Trading Economics' public-website sentence does not name NAAIM. |
| MacroMicro | Paid option only. Not used. The subscribe page does not say NAAIM is in the API. |

## Substitutes checked on 2026-09-29

None of these series is stored in `us-macro.json` or drawn in an `ISM_*`, `REDBOOK`, `NAAIM`, or `NAAIM_MA20` slot. The chart source line for those six ids says 非替代指標. Correlation with ISM, Redbook, or NAAIM was not computed: those histories are not held in this repo. Pearson correlations below use only the public files downloaded for this check, on overlapping months, with no rescaling and no gap fill.

FRED tags on every regional series below are "Copyrighted: Citation Required." FRED's terms (https://fred.stlouisfed.org/legal/terms/) say that label allows use with attribution when displaying or publishing, and that those series "may be used for internal commercial uses and may be displayed in textbooks, newsletters, or reports to clients" with attribution. The same terms also say not to redistribute a third party's proprietary content for commercial use without express written permission from the data provider. This public dashboard is not a client report, so the histories were read for the comparison and were not published.

### ISM manufacturing and new orders

ISM Manufacturing PMI is a national composite, equal-weighted across New Orders, Production, Employment, Supplier Deliveries, and Inventories, centered at 50. ISM New Orders is one national component, also centered at 50. The regional indexes below are centered at 0 (share reporting increase minus share reporting decrease) and cover one Federal Reserve district. They were not shifted onto a 50-line.

Downloaded from FRED CSV on 2026-09-29 (HTTP 200):

| Series | FRED id | Span | Points | Latest |
| --- | --- | --- | --- | --- |
| Empire State current general business conditions, SA | `GACDISA066MSFRBNY` | 2001-07-01 to 2026-09-01 | 303 | 7.6 |
| Empire State current new orders, SA | `NOCDISA066MSFRBNY` | 2001-07-01 to 2026-09-01 | 303 | 2.0 |
| Philadelphia current general activity, SA | `GACDFSA066MSFRBPHI` | 1968-05-01 to 2026-09-01 | 701 | 37.8 |
| Philadelphia current new orders, SA | `NOCDFSA066MSFRBPHI` | 1968-05-01 to 2026-09-01 | 701 | 29.2 |
| Dallas current general business activity, SA | `BACTSAMFRBDAL` | 2004-06-01 to 2026-09-01 | 268 | 9.8 |
| Dallas current new orders, SA | `VNWOSAMFRBDAL` | 2004-06-01 to 2026-09-01 | 268 | 30.7 |

FRED's own notes say the Empire and Philadelphia general-activity readings, and the Dallas general-business-activity reading, are a distinct survey question, not a weighted composite. Dallas new orders is the Texas Manufacturing Outlook Survey new-orders diffusion index. Guessed Dallas ids `NOCDSAMFRBDAL` and `NEWORDSAMFRBDAL` returned HTTP 404; `VNWOSAMFRBDAL` is the series that exists.

Not on FRED. A FRED search for the Kansas City manufacturing composite returned no series links. A Richmond search returned industrial-production series, not the Fifth District survey. Guessed ids `RICHMONDMFG`, `MNFGIDX`, and `KCCOMPOSITE` returned HTTP 404. The publishers do post files:

| Series | File checked | Span | Points | Latest |
| --- | --- | --- | --- | --- |
| Richmond composite, SA (`sa_mfg_composite`) | https://www.richmondfed.org/-/media/RichmondFedOrg/region_communities/regional_data_analysis/regional_economy/surveys_of_business_conditions/manufacturing/data/mfg_historicaldata.xlsx | 1993-11-01 to 2026-09-01 | 395 | -2 |
| Richmond new orders, SA (`sa_mfg_new_orders_c`) | same workbook | 1993-11-01 to 2026-09-01 | 395 | -6 |
| Kansas City composite, SA, versus a month ago | https://www.kansascityfed.org/documents/19152/2026Sept24historicalmfg.xlsx | monthly columns 2001-07-31 through 2026-09-26 | 303 | 14 |
| Kansas City volume of new orders, SA | same workbook | same columns | 303 | 24 |

Richmond's page asks for the citation "Manufacturing Survey." Federal Reserve Bank of Richmond, and the retrieved page does not grant redistribution. The September 2026 Richmond release text matches the workbook: composite -2. Kansas City's 24 September 2026 release says the month-over-month composite was 14, which matches the workbook. Kansas City's page offers "Historical Monthly Data" and the retrieved page does not state a redistribution right. Kansas City describes its composite as an average of production, new orders, employment, supplier delivery time, and raw materials inventory. That is still a Tenth District survey, not ISM.

Pearson r among these public activity indexes (levels, overlapping months):

| Pair | Overlap | r |
| --- | --- | --- |
| Empire general vs Philadelphia general | 303 | 0.694 |
| Empire general vs Dallas general activity | 268 | 0.766 |
| Philadelphia general vs Dallas general activity | 268 | 0.779 |
| Kansas City composite vs Empire general | 303 | 0.713 |
| Kansas City composite vs Philadelphia general | 303 | 0.704 |
| Kansas City composite vs Dallas general activity | 268 | 0.776 |
| Kansas City composite vs Richmond composite | 303 | 0.656 |
| Richmond composite vs Empire general | 303 | 0.650 |
| Richmond composite vs Philadelphia general | 395 | 0.696 |
| Richmond composite vs Dallas general activity | 268 | 0.715 |

New-orders indexes against each other:

| Pair | Overlap | r |
| --- | --- | --- |
| Empire vs Philadelphia | 303 | 0.638 |
| Empire vs Dallas | 268 | 0.713 |
| Philadelphia vs Dallas | 268 | 0.717 |
| Kansas City vs Empire | 303 | 0.654 |
| Kansas City vs Philadelphia | 303 | 0.634 |
| Kansas City vs Dallas | 268 | 0.786 |
| Richmond vs Empire | 303 | 0.590 |
| Richmond vs Philadelphia | 395 | 0.651 |
| Richmond vs Dallas | 268 | 0.675 |
| Richmond vs Kansas City | 303 | 0.613 |

Within one survey, the headline and new orders move together (Empire 0.930 on 303 months, Philadelphia 0.917 on 701, Dallas 0.896 on 268). That does not make either one the ISM composite.

### ISM services

ISM Services PMI is a national composite of Business Activity, New Orders, Employment, and Supplier Deliveries, centered at 50. The public services surveys below are regional and centered at 0.

| Series | Id or file | Span | Points | Latest | Difference from ISM Services |
| --- | --- | --- | --- | --- | --- |
| NY Fed Business Leaders current business activity, NSA | FRED `BACDINA066MNFRBNY` | 2004-09-01 to 2026-09-01 | 265 | -8.7 | Service firms in New York, northern New Jersey, and Fairfield County. FRED says the headline is a distinct question. Not seasonally adjusted. |
| Philadelphia nonmanufacturing firm general activity, SA | FRED `GABNDIF066MSFRBPHI` | 2011-03-01 to 2026-09-01 | 187 | 0.3 | Third District nonmanufacturing firms. A firm-activity diffusion index, not the four-part ISM composite. |
| Dallas TSSOS current revenue, SA | FRED `TSSOSREVSAMFRBDAL` | 2007-01-01 to 2026-08-01 | 236 | 6.6 | Texas service-sector revenue. Not a composite, and the September 2026 month was not in the file on this download. |

Pearson r: NY vs Philadelphia 0.698 (187 months), NY vs Dallas revenue 0.670 (236), Philadelphia vs Dallas revenue 0.671 (186). No correlation with ISM Services was computed.

### S&P Global PMI

Not a free legal source for this site. The S&P Global Marketplace page says PMI data "are available only via subscription." Press releases say the intellectual property is owned by or licensed to S&P Global and that unauthorized copying, distributing, or transmitting is not permitted without prior consent. FRED CSV requests for `MARKITUSM`, `USPMI`, and `SPMFGPMI` returned HTTP 404. S&P's methodology note on the manufacturing press release says the US manufacturing panel is about 600 firms, collection began in May 2007, and the index is centered at 50. That is a different panel from ISM even before the license block. No history was stored, so no correlation with ISM or with the regional surveys was computed.

### Redbook

Census advance retail sales are already on the retail chart as `RSAFS` (12-month percent change), with `MRTSSM4541USN` for nonstore retail. FRED tags `RSAFS` "Public Domain: Citation Requested." The series is monthly dollars, seasonally adjusted, and the latest month is an advance estimate from a subsample of the Monthly Retail Trade Survey. The Census retail pages list monthly MARTS and MRTS releases. No Census weekly retail series was found. Redbook is a weekly same-store percent change. Those differences are why `RSAFS` keeps its own name and `REDBOOK` stays empty. Correlation with Redbook was not computed.

## Pipeline rules that apply even though these six stay empty

- HTTP fetches use a timeout, three retries, and User-Agent `stocktools-macro-builder/1.0 (+https://stocktools.cc)`.
- Before writing `public/macro-data/us-macro.json`, the builder loads the live file at `https://stocktools.cc/macro-data/us-macro.json` and, if that fails, the previous local file. A failed or empty refresh keeps the previous points and their original dates. It does not stamp today's date and does not replace values with 0.
- A successful refresh merges by date. The new value wins on a date that both sides have, so revisions land, and older dates that the refresh did not return are kept.
- Series ids in `LICENSED_SERIES` are cleared even if a previous file contains points for them.
- Output is JSON with `allow_nan=False`. Dates are `YYYY-MM-DD`. Duplicate dates collapse to the last finite number. Gaps are not interpolated.
- The chart inserts a null break between observations farther apart than the series' normal spacing, and does not connect across that null. A null tooltip is an em dash, not 0. Ratios smaller than 0.01 keep four significant digits so a real value such as the copper/gold ratio is not rounded to 0 on the card.
