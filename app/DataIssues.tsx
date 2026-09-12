import { useState } from 'react';

type Props = { snapshot: any; go: (symbol: string) => void };
function missingReasons(stock: any): string[] {
  const missing = [
    ...(stock.fundamentals?.checks || []),
    ...(stock.technical?.checks || []),
  ]
    .filter((c) => c.status === 'missing')
    .map((c) => `${c.label}：資料缺漏`);
  if (!stock.technical?.available)
    missing.push(stock.technical?.reason || '歷史行情不足，無法計算趨勢');
  return [...new Set([...missing, ...(stock.warnings || [])])] as string[];
}
export function DataIssues({ snapshot, go }: Props) {
  const [kind, setKind] = useState('ALL');
  const [query, setQuery] = useState('');
  const incomplete = snapshot.stocks.filter(
    (s: any) => s.status === 'INCOMPLETE',
  );
  const issues = [
    ...incomplete.map((s: any) => ({
      symbol: s.symbol,
      name: s.name,
      kind: 'INCOMPLETE',
      stock: s,
      reasons: missingReasons(s),
      retained: false,
    })),
    ...snapshot.errors.map((e: any) => {
      const old = snapshot.retainedStocks?.find(
        (s: any) => s.symbol === e.symbol,
      );
      return {
        symbol: e.symbol,
        name: old?.name || '',
        kind: 'FAILED',
        stock: old,
        retained: !!old,
        reasons: [
          e.rateLimited || e.kind === 'YFRateLimitError'
            ? '來源限制請求頻率，本次未取得資料'
            : '本次未能取得來源資料，不能判定條件是否改變',
          ...(e.attempts != null
            ? [
                `本次已嘗試 ${e.attempts} 次${e.attempts === 0 ? '；限流後延後請求' : ''}`,
              ]
            : []),
        ],
      };
    }),
  ].filter(
    (i) =>
      (kind === 'ALL' || i.kind === kind) &&
      `${i.symbol} ${i.name}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <details className="panel data-issues" id="data-issues">
      <summary>
        資料檢查明細 · 不足／不適用 {incomplete.length} 檔 · 取得失敗{' '}
        {snapshot.errors.length} 檔
      </summary>
      <p className="subtitle">
        資料不足與不適用不代表公司不好；取得失敗也不代表條件失效。以下列出缺漏項目及相關提醒，點開可查看完整分析。
      </p>
      <div className="issue-controls">
        <label>
          搜尋問題股票
          <input
            aria-label="搜尋資料問題股票"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="代號或公司名稱"
          />
        </label>
        <label>
          問題類型
          <select
            aria-label="資料問題類型"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="ALL">全部問題</option>
            <option value="INCOMPLETE">資料不足／不適用</option>
            <option value="FAILED">取得失敗</option>
          </select>
        </label>
      </div>
      <p className="footnote" role="status">
        顯示 {issues.length} 檔 · 原始取得日期保留，不以本次掃描時間替代。
      </p>
      <div className="issue-grid">
        {issues.map((i) => (
          <article className="issue-card" key={i.symbol}>
            <h3>
              {i.symbol} <small>{i.name}</small>
            </h3>
            <p className="retained-label">
              {i.kind === 'FAILED'
                ? '取得失敗 · 待補抓'
                : '資料不足／規則不適用'}
            </p>
            <ul>
              {(i.reasons.length
                ? i.reasons
                : ['目前資料不足，請查看分析頁各條件與來源說明']
              ).map((r: string, n: number) => (
                <li key={n}>{r}</li>
              ))}
            </ul>
            {i.stock && (
              <p className="footnote">
                {i.retained ? '上次紀錄 · ' : ''}行情{' '}
                {i.stock.technical?.priceDate || '未知'} · 財報期{' '}
                {i.stock.financials?.fiscalDate || '未知'}
              </p>
            )}
            <button type="button" onClick={() => go(i.symbol)}>
              {i.retained
                ? '查看上次紀錄（待更新）'
                : i.kind === 'FAILED'
                  ? '嘗試查詢最新分析'
                  : '查看條件明細'}{' '}
              <span aria-hidden="true">↗</span>
              <span className="sr-only"> {i.symbol}</span>
            </button>
          </article>
        ))}
      </div>
      {!issues.length && <p>此分類沒有符合搜尋的資料問題。</p>}
    </details>
  );
}
