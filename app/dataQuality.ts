export const issueLabels: Record<string, string> = {
  INDUSTRY: '產業規則不適用',
  CURRENCY: '財報幣別待確認',
  HISTORY: '歷史行情不足',
  STALE: '資料日期待更新',
  MISSING: '財報欄位缺漏',
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
  const kind = industry
    ? 'INDUSTRY'
    : currency
      ? 'CURRENCY'
      : history
        ? 'HISTORY'
        : stale
          ? 'STALE'
          : missing.length
            ? 'MISSING'
            : 'OTHER';
  const f = stock.financials || {};
  const reasons: string[] = [];
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
    STALE: '等待來源提供更新期間；可開啟分析重新查詢。',
    MISSING: '可重新查詢來源；若仍缺漏，需核對公司原始財報，不能用零補值。',
    OTHER: '請查看完整條件明細，確認尚未取得的資料。',
  };
  return { kind, reasons: [...new Set(reasons)], next: next[kind] };
}
