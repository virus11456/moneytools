import { useState } from 'react';
import { dataQuality, issueLabels, financialReview } from './dataQuality';

type Props = { snapshot: any; go: (symbol: string) => void };
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
      ...dataQuality(s),
      stock: s,
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
        next: old
          ? '下次掃描會再嘗試；目前可查看上次紀錄。'
          : '下次掃描會再嘗試；也可點開個股重新查詢。',
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
  ];
  const counts = Object.fromEntries(
    Object.keys(issueLabels).map((key) => [
      key,
      issues.filter((i) => i.kind === key).length,
    ]),
  );
  const visible = issues.filter(
    (i) =>
      (kind === 'ALL' || i.kind === kind) &&
      `${i.symbol} ${i.name}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <details className="panel data-issues" id="data-issues">
      <summary>
        資料檢查明細 · 產業不適用 {counts.INDUSTRY} 檔 · 資料待確認{' '}
        {incomplete.length - counts.INDUSTRY} 檔 · 取得失敗{' '}
        {snapshot.errors.length} 檔
      </summary>
      <p className="subtitle">
        資料不足與不適用不代表公司不好；取得失敗也不代表條件失效。以下列出缺漏項目及相關提醒，點開可查看完整分析。
      </p>
      <p className="footnote">
        每檔依主要原因計數一次；同時存在的其他缺漏會列在卡片中。分類依這次掃描資料，不代表公司品質差。
      </p>
      <div className="issue-counts">
        {Object.entries(issueLabels)
          .filter(([key]) => counts[key] > 0)
          .map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={kind === key}
              onClick={() => setKind(kind === key ? 'ALL' : key)}
            >
              {label} <strong>{counts[key]}</strong>
            </button>
          ))}
      </div>
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
            {Object.entries(issueLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}（{counts[key]}）
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="footnote" role="status">
        顯示 {visible.length} 檔 · 原始取得日期保留，不以本次掃描時間替代。
      </p>
      <div className="issue-grid">
        {visible.map((i) => (
          <article className="issue-card" key={i.symbol}>
            <h3>
              {i.symbol} <small>{i.name}</small>
            </h3>
            <p className="retained-label">{issueLabels[i.kind]}</p>
            <ul>
              {(i.reasons.length
                ? i.reasons
                : ['目前資料不足，請查看分析頁各條件與來源說明']
              ).map((r: string, n: number) => (
                <li key={n}>{r}</li>
              ))}
            </ul>
            <p className="footnote">下一步：{i.next}</p>
            {i.stock && financialReview(i.stock) && (
              <p className="footnote">
                <a
                  href={financialReview(i.stock)!.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  原始財報與核對依據 ↗
                </a>{' '}
                · 核對日期 2026-09-13
              </p>
            )}
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
      {!visible.length && <p>此分類沒有符合搜尋的資料問題。</p>}
    </details>
  );
}
