# Missing financial fields reviewed 2026-09-13

Re-read annual Yahoo statements for ABNB, FTV, VEEV, LNT, LII, ELV, HUM.
No missing field was recovered by merely fetching those statements again.

- **LII, 2025-12-31**: Yahoo omits Operating Cash Flow but provides Cash Flow
  From Continuing Operating Activities of USD 757.6m. The company's 2025 10-K
  explicitly reports consolidated net cash provided by operating activities of
  USD 757.6m. A reviewed supplement fills only this missing field, with source,
  period, currency, review date and matching revenue/capex guards. It does not
  implement a general substitution of continuing for consolidated cash flow.
  Source: https://investor.lennox.com/node/29846/html (Statement of Cash Flows).
- **ABNB, FTV, VEEV, LNT**: annual capex is absent, while Yahoo Free Cash Flow
  equals Operating Cash Flow. Do not use reported FCF as a fallback or infer
  zero capex. FTV's 2025 filing separates continuing/discontinued operations;
  a continuing-only capex figure cannot safely complete total cash flow.
  VEEV aggregates investing outflows under Long-term assets. LNT groups
  construction and acquisition outflows. Those are not blindly interchangeable
  with this dashboard's capital expenditure field.
- **ELV, HUM**: annual Operating Income is absent. No substitution from net
  income, EBIT, pretax income, or segment adjusted profit is implemented.

Primary statements inspected:
- https://investors.fortive.com/sec-filings/all-sec-filings/content/0001659166-26-000007/ftv-20251231.htm
- https://ir.veeva.com/news/news-details/2026/Veeva-Announces-Fourth-Quarter-and-Fiscal-Year-2026-Results/default.aspx
- https://investors.alliantenergy.com/News--Presentations/news/news-details/2026/Alliant-Energy-Announces-2025-Results/default.aspx
- https://www.sec.gov/Archives/edgar/data/1559720/000119312526048670/d58192dex991.htm

Reviewed supplements are maintained in `moneytools/verified_financials.py`.
They are not a second automatic data feed. New periods require new review.
The SEC Company Facts endpoint returned HTTP 403 during this review, so no
live SEC API fallback was enabled. Screening thresholds remain unchanged.
