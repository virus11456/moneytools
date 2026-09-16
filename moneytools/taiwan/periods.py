"""Period-safe aggregates; inputs must already share verified currency/unit/basis."""
from .official import number


def single_quarter(cumulative, year, quarter):
    if quarter not in (1, 2, 3, 4):
        raise ValueError('Quarter must be 1..4')
    current = number(cumulative.get((year, quarter)))
    if current is None or quarter == 1:
        return current
    previous = number(cumulative.get((year, quarter - 1)))
    return current - previous if previous is not None else None


def trailing_four_quarters(cumulative, year, quarter):
    if quarter not in (1, 2, 3, 4):
        raise ValueError('Quarter must be 1..4')
    values = []
    for offset in range(4):
        ordinal = year * 4 + quarter - 1 - offset
        y, q = divmod(ordinal, 4)
        values.append(single_quarter(cumulative, y, q + 1))
    return sum(values) if all(v is not None for v in values) else None


def three_month_yoy(months, year, month):
    if not 1 <= month <= 12:
        raise ValueError('Month must be 1..12')
    current = []; prior = []
    for offset in range(3):
        ordinal = year * 12 + month - 1 - offset
        y, m = divmod(ordinal, 12)
        current.append(number(months.get((y, m + 1))))
        prior.append(number(months.get((y - 1, m + 1))))
    if any(v is None for v in current + prior) or sum(prior) <= 0:
        return None
    return sum(current) / sum(prior) - 1
