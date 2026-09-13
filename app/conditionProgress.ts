// Display helpers for method 2.0.0; the server remains the source of pass/fail decisions.
const n = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const fmt = (x: number) => x !== 0 && Math.abs(x) < .0001
  ? (x < 0 ? '−' : '') + '小於 0.0001'
  : new Intl.NumberFormat('zh-TW', {maximumFractionDigits: 4}).format(x);
export function conditionGap(c: any, stock: any): string {
  if (stock.methodVersion !== '2.0.0') return '請依本版本條件說明判讀';
  if (c.status === 'missing' || !n(c.value)) return '資料不足，暫不估算差距';
  const v = c.value;
  if (c.key === 'growth') return v >= .15 ? '已達 15% 門檻' : `距 15% 尚差 ${fmt((.15-v)*100)} 個百分點`;
  if (c.key === 'margin') return v > 0 ? '已高於 0%' : `距 0% ${fmt(Math.abs(v)*100)} 個百分點；必須大於 0%`;
  if (['revenue','liquidity','ocf','fcf'].includes(c.key)) {
    if (c.key !== 'liquidity' && stock.financialCurrency !== 'USD') return '財報非 USD 或幣別未知，不直接比較美元門檻';
    const threshold = c.key === 'revenue' ? 100000000 : c.key === 'liquidity' ? 10000000 : 0;
    return threshold ? (v >= threshold ? '已達金額門檻' : `距門檻尚差 ${fmt(threshold-v)} USD`) : (v > 0 ? '已為正值' : `距 0 為 ${fmt(Math.abs(v))} USD；必須大於 0`);
  }
  if (c.key === 'distance') return v <= .02 ? '已在 2% 範圍內' : `距 2% 上限尚差 ${fmt((v-.02)*100)} 個百分點`;
  if (c.key === 'rr') return v >= 2 ? '已達 2 : 1' : `距 2 : 1 尚差 ${fmt(2-v)}`;
  if (c.key === 'zone') {
    const e=stock.entry, price=stock.technical?.price;
    if (![e?.zoneLow,e?.zoneHigh,price].every(n)) return '觀察區資料不足';
    const touch = v <= e.zoneHigh
      ? `最低價 ${fmt(v)} USD 已觸及區間上緣 ${fmt(e.zoneHigh)} USD`
      : `最低價高於區間上緣 ${fmt(v-e.zoneHigh)} USD，尚未回測`;
    const hold = price >= e.zoneLow
      ? `收盤 ${fmt(price)} USD 已守住下緣 ${fmt(e.zoneLow)} USD`
      : `收盤低於區間下緣 ${fmt(e.zoneLow-price)} USD，尚未守住`;
    return `${touch}；${hold}`;
  }
  if (c.key === 'volume') return v >= 1 ? '已達前 20 日均量' : `距 1 倍均量尚差 ${fmt(1-v)} 倍`;
  if (['ma50rise','ma200rise'].includes(c.key)) return v > 0 ? '已高於 20 個交易日前' : `距持平 ${fmt(Math.abs(v))} USD；必須高於持平`;
  if (c.key === 'alignment') {
    const t=stock.technical;
    if (![t?.price,t?.sma50,t?.sma200].every(n)) return '均線資料不足';
    return `收盤 ${fmt(t.price)} / MA50 ${fmt(t.sma50)} / MA200 ${fmt(t.sma200)} USD；需依序嚴格遞減`;
  }
  if (c.key === 'reclaim') {
    const bars=stock.technical?.bars || [], high=bars[bars.length-2]?.high;
    return n(high) ? `前日高點 ${fmt(high)} USD；${v>high ? '已站回' : `距該價位 ${fmt(high-v)} USD，需收盤高於此價`}` : '前日高點資料不足';
  }
  return '';
}
export function remainingConditions(stock: any): string {
  if (stock.status === 'INCOMPLETE' || stock.dataStatus === 'retained') return '資料待確認，暫不估算剩餘條件';
  if (stock.methodVersion !== '2.0.0') return '請依本版本條件說明判讀';
  const rows = stock.fundamentals?.passed ? stock.technical?.checks : stock.fundamentals?.checks;
  const failed = (rows || []).filter((c:any)=>c.status !== 'pass');
  if (failed.length) return `${stock.fundamentals?.passed ? '技術面' : '基本面'}待確認 ${failed.length} 項 · ${failed[0].label}${failed.length>1 ? '等' : ''}`;
  if (stock.status === 'READY') return '進場條件已符合';
  const e=stock.entry;
  if (!n(e?.distance) || !n(e?.riskReward)) return '進場價位或報酬／風險待確認';
  const count=(e.distance>.02?1:0)+(e.riskReward<2?1:0)+(e.confirmation||[]).filter((c:any)=>c.status!=='pass').length;
  return count ? `進場條件待確認 ${count} 項` : '請查看條件明細';
}
