"""Reviewed, period-bound source supplements; never infer missing values as zero."""
from copy import deepcopy
from datetime import date
from .engine import num

# Values are USD, not the millions used in the cited report. Add a new entry only
# after reviewing the primary filing. A different period/currency cannot reuse it.
REVIEWED = [{
    'symbol': 'LII', 'fiscalDate': '2025-12-31', 'currency': 'USD',
    'field': 'operatingCashflow', 'label': '營業現金流', 'value': 757_600_000,
    'sourceUrl': 'https://investor.lennox.com/node/29846/html',
    'sourceTitle': 'Lennox 2025 Form 10-K · Statement of Cash Flows',
    'sourceRow': 'Net cash provided by operating activities',
    'reviewedAt': '2026-09-13',
    'note': '公司年報原表單位為百萬美元；757.6 × 1,000,000。僅補來源缺漏，不覆蓋已提供數值。',
    'anchors': {'revenue': 5_195_300_000, 'capitalExpenditure': -118_800_000},
}]


def supplement(record, entries=None):
    result = deepcopy(record)
    f = result.setdefault('financials', {})
    applied = []
    for entry in REVIEWED if entries is None else entries:
        if (result.get('symbol') != entry['symbol'] or
            result.get('financialCurrency') != entry['currency'] or
            f.get('fiscalDate') != entry['fiscalDate']):
            continue
        # Skip historical/as-of records from before this review existed.
        try:
            if date.fromisoformat(result['fetchedAt'][:10]) < date.fromisoformat(entry['reviewedAt']):
                continue
        except (KeyError, ValueError, TypeError):
            continue
        if num(f.get(entry['field'])) is not None:
            continue
        # Stop using a reviewed supplement if upstream restates the companion
        # statement. Review again rather than blending different filing versions.
        if any(num(f.get(key)) != expected for key, expected in entry['anchors'].items()):
            continue
        f[entry['field']] = entry['value']
        applied.append({k: v for k, v in entry.items() if k not in ('anchors', 'symbol')})
    if applied:
        result['financialSupplements'] = applied
        result['source'] = result.get('source', 'Yahoo Finance / yfinance') + ' + 公司原始年報（已核對補值）'
    return result
