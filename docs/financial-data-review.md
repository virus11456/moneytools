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

## Further primary-filing review (2026-09-13)

- **ABNB**: the 2025 10-K's FCF reconciliation explicitly reports PPE purchases
  of USD 33m and FCF of USD 4,613m. Added a missing-only capex supplement of
  USD -33m, guarded by revenue and operating cash flow from the same table.
  https://www.sec.gov/Archives/edgar/data/1559720/000155972026000004/abnb-20251231.htm
- **HUM**: the 2025 consolidated income statement reports Income from operations
  of USD 2,704m, not the insurance segment's USD 1,664m. Added the consolidated
  amount with period/currency/revenue/cash-flow guards. The earlier decision to
  leave this gap open is superseded by this filing review.
  https://www.sec.gov/Archives/edgar/data/49071/000004907126000009/hum-20251231.htm
- **ELV**: the filing defines operating gain as a separate management/segment
  metric, with a reconciliation to pretax income. Do not substitute it for GAAP
  operating income. Remains missing.
  https://www.sec.gov/Archives/edgar/data/1156039/000115603926000013/elv-20251231.htm
- **VEEV**: 2026 10-K still aggregates the investing outflow under Long-term
  assets. No unambiguous PPE-only cash amount adopted in this review.
  https://www.sec.gov/Archives/edgar/data/1393052/000139305226000014/veev-20260131.htm
- **FTV/LNT**: remain unresolved under the existing consistent-scope rules;
  continuing operations and construction/acquisition aggregates are not treated
  as interchangeable with the missing field merely to increase coverage.
