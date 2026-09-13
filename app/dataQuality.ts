export const issueLabels: Record<string, string> = {
  INDUSTRY: '產業規則不適用',
  CURRENCY: '財報幣別待確認',
  HISTORY: '歷史行情不足',
  STALE: '資料日期待更新',
  MISSING: '財報欄位缺漏',
  REVIEW: '財報口徑待核對',
  OTHER: '其他待確認',
  FAILED: '取得失敗',
};

// Classify the published scan, not today's wall clock. Each stock has one primary
// category; all other blocking reasons remain visible in its detail list.
export function dataQuality(stock: any) {
  const warnings: string[] = stock.warnings || [];
  const checks = stock.fundamentals?.checks || [];
  const missing = checks.filter((c: any) => c.status === 'missing');
  const industry = ['Financial Services', 'Real Estate'].includes(stock.sector);
  const currency = stock.financialCurrency !== 'USD';
  const history = !stock.technical?.available;
  const stale = warnings.some((w) => /財報日期缺漏|行情不足或超過/.test(w));
  const review = financialReview(stock);
  const kind = industry
    ? 'INDUSTRY'
    : currency
      ? 'CURRENCY'
      : history
        ? 'HISTORY'
        : stale
          ? 'STALE'
          : review
            ? 'REVIEW'
            : missing.length
              ? 'MISSING'
              : 'OTHER';
  const f = stock.financials || {};
  const reasons: string[] = [];
  if (review) reasons.push(review.reason);
  if (industry)
    reasons.push(
      '現有一般企業規則暫不適用金融與不動產業；重新抓取不會解除這項限制',
    );
  if (currency)
    reasons.push(
      `財報幣別：${stock.financialCurrency || '來源未提供'}；尚未換算為美元`,
    );
  if (history)
    reasons.push(stock.technical?.reason || '歷史行情不足，無法計算趨勢');
  const required: [string, string][] = [
    ['revenue', '年度營收'],
    ['previousRevenue', '前一年度營收'],
    ['operatingIncome', '營業利益'],
    ['operatingCashflow', '營業現金流'],
    ['capitalExpenditure', '資本支出'],
  ];
  for (const [field, label] of required) {
    if (f[field] == null)
      reasons.push(
        `${label}：來源未提供同一財報期間的有效數值${field === 'capitalExpenditure' ? '，無法計算自由現金流；不視為零' : ''}`,
      );
  }
  for (const c of missing) reasons.push(`${c.label}：無法判定`);
  for (const c of stock.technical?.checks || []) {
    if (c.status === 'missing')
      reasons.push(`${c.label}：${c.detail || '資料缺漏'}`);
  }
  reasons.push(
    ...warnings.filter(
      (w) =>
        /財報日期缺漏|行情不足或超過/.test(w) &&
        !(history && w.startsWith('行情不足')),
    ),
  );
  const next: Record<string, string> = {
    INDUSTRY: '需另訂產業專用規則；目前不納入一般企業符合清單。',
    CURRENCY: '需確認財報原幣別；不能直接以美元門檻判定。',
    HISTORY: '需累積足夠交易日；反覆補抓不保證能補足歷史。',
    STALE: '等待來源提供更新期間；分析頁保留本次掃描結果。',
    REVIEW: '需核對同一合併範圍與會計定義，才可補值；目前仍無法完整判定。',
    MISSING: '等待來源補齊，或核對公司原始財報；不能用零補值。',
    OTHER: '請查看完整條件明細，確認尚未取得的資料。',
  };
  return { kind, reasons: [...new Set(reasons)], next: next[kind] };
}

const financialReviews: Record<
  string,
  { period: string; field: string; reason: string; url: string }
> = {
  ELV: {
    period: '2025-12-31',
    field: 'operatingIncome',
    reason:
      '公司另行定義 operating gain，用於部門績效衡量；不能直接替代本工具的營業利益欄位。',
    url: 'https://www.sec.gov/Archives/edgar/data/1156039/000115603926000013/elv-20251231.htm',
  },
  FTV: {
    period: '2025-12-31',
    field: 'capitalExpenditure',
    reason:
      '現金流區分持續與停業部門；已查到的持續部門支出，不能直接與合併營業現金流混算。',
    url: 'https://investors.fortive.com/sec-filings/all-sec-filings/content/0001659166-26-000007/ftv-20251231.htm',
  },
  VEEV: {
    period: '2026-01-31',
    field: 'capitalExpenditure',
    reason:
      '現金流量表將相關支出合併列為長期資產；尚未核對可單獨對應的資本支出數值。',
    url: 'https://www.sec.gov/Archives/edgar/data/1393052/000139305226000014/veev-20260131.htm',
  },
  LNT: {
    period: '2025-12-31',
    field: 'capitalExpenditure',
    reason:
      '支出以建設與收購合併列示，需確認包含項目，不能直接把整筆視為本工具的資本支出。',
    url: 'https://investors.alliantenergy.com/News--Presentations/news/news-details/2026/Alliant-Energy-Announces-2025-Results/default.aspx',
  },
};

export function financialReview(stock: any) {
  const review = financialReviews[stock.symbol];
  if (
    !review ||
    stock.financialCurrency !== 'USD' ||
    stock.financials?.fiscalDate !== review.period ||
    stock.financials?.[review.field] != null
  )
    return null;
  return { ...review, reviewedAt: '2026-09-13' };
}
