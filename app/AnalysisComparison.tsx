const statusNames: Record<string, string> = { READY: '進場條件符合', APPROACHING: '接近觀察區', QUALITY: '第一階段符合', WAIT: '等待條件', INCOMPLETE: '資料不足', pass: '符合', fail: '未符合', missing: '資料不足' };
const value = (v: unknown) => typeof v === 'number' ? new Intl.NumberFormat('zh-TW', { maximumSignificantDigits: 6 }).format(v) : v == null ? '—' : String(v);
const stamp = (v: string) => v && Number.isFinite(Date.parse(v)) ? new Date(v).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '—';
function checks(stock: any) {
  const result = new Map<string, any>();
  for (const [group, rows] of [['基本面', stock.fundamentals?.checks], ['技術面', stock.technical?.checks], ['確認訊號', stock.entry?.confirmation]] as const) {
    for (const row of rows || []) result.set(`${group}:${row.key}`, { ...row, group });
  }
  return result;
}
export const changeNames: Record<string, string> = { gained: '新符合', lost: '失去符合', data: '資料完整度變化', rule: '條件說明變更', value: '數值變動' };
export function changeKind(before: any, after: any) {
  if (!before || !after || before.status === 'missing' || after.status === 'missing') return 'data';
  if (before.detail !== after.detail) return 'rule';
  if (before.status !== 'pass' && after.status === 'pass') return 'gained';
  if (before.status === 'pass' && after.status !== 'pass') return 'lost';
  return 'value';
}
export function comparisonValue(c: any, currency?: string) {
  if (!c || c.status === 'missing' || c.value == null || (typeof c.value === 'number' && !Number.isFinite(c.value))) return '資料不足';
  const n = c.value;
  if (typeof n !== 'number') return value(n);
  if (['growth', 'margin', 'distance', 'slope'].includes(c.key)) return `${value(n * 100)}%`;
  if (['volume', 'rr'].includes(c.key)) return `${value(n)} 倍`;
  if (['revenue', 'ocf', 'fcf'].includes(c.key)) return `${value(n)} ${currency || '（財報幣別未知）'}`;
  if (['alignment', 'liquidity', 'reclaim', 'zone', 'ma50rise', 'ma200rise'].includes(c.key)) return `${value(n)} USD${['ma50rise', 'ma200rise'].includes(c.key) ? ' 差額' : ''}`;
  return value(n);
}
export function compareAnalysis(before: any, after: any) {
  if (!before || !after || before.symbol !== after.symbol || before.methodVersion !== after.methodVersion) return null;
  const left = checks(before), right = checks(after);
  const differences: any[] = [];
  for (const key of new Set([...left.keys(), ...right.keys()])) {
    const a = left.get(key), b = right.get(key);
    const sameValue = typeof a?.value === 'number' && typeof b?.value === 'number'
      ? Math.abs(a.value - b.value) <= Math.max(1, Math.abs(a.value), Math.abs(b.value)) * 1e-9
      : (a?.value ?? null) === (b?.value ?? null);
    if (!a || !b || a.status !== b.status || a.detail !== b.detail || !sameValue) differences.push({ key, before: a, after: b, kind: changeKind(a, b) });
  }
  return { differences, newerScan: Date.parse(before.fetchedAt) > Date.parse(after.fetchedAt), periodChanged: before.financials?.fiscalDate !== after.financials?.fiscalDate };
}
export function AnalysisComparison({ scan, current }: { scan: any; current: any }) {
  if (!scan) return <p className="muted">這檔股票尚無每日掃描紀錄可供比較。</p>;
  const comparison = compareAnalysis(scan, current);
  if (!comparison) return <p className="muted">分析規則版本不同，暫不直接比較條件變化。</p>;
  return <details className="panel analysis-comparison">
    <summary>與每日紀錄比較 · {comparison.differences.length} 條條件有差異</summary>
    <p className="muted">每日紀錄：{stamp(scan.fetchedAt)} · 單次查詢：{stamp(current.fetchedAt)}（台北時間）</p>
    {scan.dataStatus === 'retained' && <p className="muted">每日紀錄為保留的舊資料，請留意資料日期。</p>}
    {comparison.newerScan && <p className="muted">每日紀錄已比這次查詢更新，可切回每日紀錄查看。</p>}
    <dl className="comparison-metrics">
      <div><dt>狀態（每日 → 查詢）</dt><dd>{statusNames[scan.status] || scan.status} → {statusNames[current.status] || current.status}</dd></div>
      <div><dt>收盤價（USD）</dt><dd>{value(scan.technical?.price)} → {value(current.technical?.price)}</dd></div>
      <div><dt>行情日期</dt><dd>{scan.technical?.priceDate || '—'} → {current.technical?.priceDate || '—'}</dd></div>
      <div><dt>財報期間</dt><dd>{scan.financials?.fiscalDate || '—'} → {current.financials?.fiscalDate || '—'}</dd></div>
    </dl>
    {comparison.periodChanged && <p className="muted">財報期間不同，數值變化可能來自新一期財報。</p>}
    <p className="muted">比較基本面、技術面與確認訊號的條件及數值。單次查詢不寫入每日變化，也不改變 TODAY 標籤。</p>
    {comparison.differences.length === 0 ? <p>條件與數值沒有變化。</p> : <ul className="comparison-changes">{comparison.differences.map(({ key, before, after, kind }) => <li key={key}>
      <span className={`comparison-kind ${kind}`}>{changeNames[kind]}</span>
      <strong>{(after || before).group} · {(after || before).label}</strong>
      <p>{before ? `${statusNames[before.status] || before.status} · ${comparisonValue(before, scan.financialCurrency)}` : '無此條件'} → {after ? `${statusNames[after.status] || after.status} · ${comparisonValue(after, current.financialCurrency)}` : '無此條件'}</p>
      {before?.detail === after?.detail && after?.detail && <p className="muted">條件：{after.detail}</p>}
      {before?.detail !== after?.detail && <p className="muted">{before?.detail || '—'} → {after?.detail || '—'}</p>}
    </li>)}</ul>}
  </details>;
}
