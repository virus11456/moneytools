import os
import re
import tempfile
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import yfinance as yf
from .engine import num

yf.set_tz_cache_location(os.path.join(tempfile.gettempdir(),'moneytools-yf'))

class DataUnavailable(Exception): pass

def normalize_symbol(symbol):
    symbol=symbol.strip().upper()
    if not re.fullmatch(r'[A-Z]{1,6}(?:[.-][A-Z])?',symbol):
        raise ValueError('請輸入有效美股代號，例如 AAPL、MSFT、BRK-B')
    return symbol.replace('.','-')

def history(ticker):
    data=ticker.history(period='2y',auto_adjust=False,timeout=15)
    now=datetime.now(ZoneInfo('America/New_York'))
    # Exclude an incomplete regular-market session (15 minute close buffer).
    last_day=now.date() if (now.hour,now.minute)>=(16,15) else (now-timedelta(days=1)).date()
    rows=[]
    for idx,row in data.iterrows():
        if idx.date()>last_day: continue
        # Yahoo history Close/OHLC is split adjusted, not dividend adjusted.
        values={k:num(row.get(col)) for k,col in [('close','Close'),('high','High'),('low','Low'),('volume','Volume')]}
        if any(v is None for v in values.values()): continue
        rows.append(dict(date=idx.date().isoformat(),**values))
    return rows

def fetch_record(symbol):
    symbol=normalize_symbol(symbol); ticker=yf.Ticker(symbol)
    info=ticker.get_info()
    if info.get('quoteType')!='EQUITY' or info.get('currency')!='USD' or info.get('exchange') not in ('NMS','NGM','NCM','NYQ','ASE','PCX','BTS'):
        raise DataUnavailable('僅支援美國交易所、美元報價的個股；代號無效或資料暫時無法取得')
    bars=history(ticker)
    if not bars: raise DataUnavailable('目前無法取得歷史行情，請稍後重試')
    income=ticker.income_stmt; cash=ticker.cashflow; balance=ticker.balance_sheet
    # Select newest complete revenue fiscal year; align every metric to that exact date.
    columns=sorted([c for c in income.columns if 'Total Revenue' in income.index and num(income.loc['Total Revenue',c]) is not None],reverse=True)
    period=columns[0] if columns else None
    previous=next((c for c in columns[1:] if period is not None and 330<=(period-c).days<=400),None)
    def value(frame,row,col=period):
        return num(frame.loc[row,col]) if col is not None and row in frame.index and col in frame.columns else None
    equity=value(balance,'Stockholders Equity')
    return dict(symbol=symbol,name=info.get('shortName',symbol),sector=info.get('sector','Unknown'),industry=info.get('industry','Unknown'),
                business=info.get('longBusinessSummary',''),currency=info.get('currency'),financialCurrency=info.get('financialCurrency'),
                marketCap=num(info.get('marketCap')),exchange=info.get('exchange'),fetchedAt=datetime.now(ZoneInfo('UTC')).isoformat(),
                source='Yahoo Finance / yfinance',financials=dict(fiscalDate=period.date().isoformat() if period is not None else None,
                previousFiscalDate=previous.date().isoformat() if previous is not None else None,
                revenue=value(income,'Total Revenue'),previousRevenue=value(income,'Total Revenue',previous),
                operatingIncome=value(income,'Operating Income'),operatingCashflow=value(cash,'Operating Cash Flow'),
                capitalExpenditure=value(cash,'Capital Expenditure'),netIncome=value(income,'Net Income'),equity=equity),bars=bars)

def benchmark(): return history(yf.Ticker('SPY'))
