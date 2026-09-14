import { useState } from 'react';
export type ScanHistory = {
  version: number;
  methodVersion: string;
  startedAt: string;
  updatedAt: string;
  events: any[];
  days: { date: string; observed: string[]; unavailable: string[] }[];
};
const names: Record<string, string> = {
  FUNDAMENTAL_ADDED: '新通過基本面',
  DUAL_ADDED: '新通過兩階段',
  FUNDAMENTAL_LOST: '基本面不再符合',
  DUAL_LOST: '技術面不再符合',
  ENTRY_CHANGED: '進場狀態改變',
  CONDITIONS_CHANGED: '條件明細改變',
};
const time = (v: string) =>
  new Date(v).toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    hour12: false,
  });
const changeText = (e: any) =>
  e.kinds.map((k: string) => names[k] || k).join(' · ');
function value(c: any) {
  if (c.value == null) return '—';
  if (['growth', 'margin', 'distance'].includes(c.key))
    return `${(c.value * 100).toFixed(1)}%`;
  if (typeof c.value !== 'number') return '—';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(c.value);
}
export function ActivityHistory({
  history,
  symbols,
  today,
  go,
  title = '近 30 天變化紀錄',
}: {
  history: ScanHistory | null;
  symbols: string[];
  today: string;
  go: (s: string) => void;
  title?: string;
}) {
  const [all, setAll] = useState(false);
  const cutoff = new Date(Date.parse(today + 'T00:00:00Z') - 29 * 86400000)
    .toISOString()
    .slice(0, 10);
  const records = (history?.events || [])
    .filter(
      (e) =>
        symbols.includes(e.symbol) &&
        e.scanDate >= cutoff &&
        e.scanDate <= today,
    )
    .slice()
    .reverse();
  const covered = (history?.days || []).filter(
    (d) =>
      d.date >= cutoff &&
      d.date <= today &&
      symbols.some((s) => d.observed.includes(s)),
  );
  const unavailable = (history?.days || []).filter(
    (d) =>
      d.date >= cutoff &&
      d.date <= today &&
      symbols.some((s) => d.unavailable.includes(s)),
  );
  return (
    <section className="history-panel panel" aria-label={title}>
      <h2>
        {title} <span className="count">{records.length}</span>
      </h2>
      <p className="footnote">
        {history
          ? `紀錄自 ${time(history.startedAt)} 起；最後更新 ${time(history.updatedAt)}（台北）。`
          : '歷史紀錄尚未載入或仍在建立。'}
        只記錄實際觀察，不回推未保存的日期；首筆資料是基準，不等於當天新符合。
      </p>
      {!!symbols.length && history && (
        <p className="footnote">
          近 30 天有有效觀察的日期 {covered.length} 天 ·
          出現資料不足／失敗的日期 {unavailable.length}{' '}
          天。沒有變化紀錄不代表期間持續符合。
        </p>
      )}
      {!symbols.length ? (
        <p>收藏股票後，這裡會顯示它們的近期變化。</p>
      ) : !records.length ? (
        <p>目前尚無已記錄的條件變化；後續掃描將持續累積。</p>
      ) : (
        (all ? records : records.slice(0, 10)).map((e, i) => (
          <article
            className="history-event"
            key={`${e.symbol}-${e.detectedAt}-${i}`}
          >
            <button className="history-link" onClick={() => go(e.symbol)}>
              <strong>{e.symbol}</strong> {changeText(e)}{' '}
              <span aria-hidden="true">↗</span>
            </button>
            <p>
              {e.previousStatus} → {e.status}
            </p>
            <p className="footnote">
              觀察時間 {time(e.detectedAt)} · 行情{' '}
              {e.comparisonPriceDate || e.previousPriceDate || '未知'} →{' '}
              {e.priceDate || '未知'}
            </p>
            <p className="footnote">{e.reasons?.join(' · ')}</p>
            {!!e.conditionChanges?.length && (
              <details>
                <summary>查看改變的條件（{e.conditionChanges.length}）</summary>
                <ul>
                  {e.conditionChanges.map((c: any) => (
                    <li key={c.key}>
                      {c.label}：
                      {c.before.status === 'pass' ? '通過' : '未通過'} →{' '}
                      {c.after.status === 'pass' ? '通過' : '未通過'}
                      <br />
                      數值 {value(c.before)} → {value(c.after)} ·{' '}
                      {c.after.detail}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </article>
        ))
      )}
      {records.length > 10 && (
        <button className="history-more" onClick={() => setAll(!all)}>
          {all ? '只顯示最近 10 筆' : `顯示全部 ${records.length} 筆`}
        </button>
      )}
      <p className="footnote">歷史狀態不代表目前仍符合；點代號查看最新分析。</p>
    </section>
  );
}
export function SavedActivity({
  saved,
  changes,
  fresh,
  stocks,
  errors,
  go,
}: {
  saved: string[];
  changes: any[];
  fresh: boolean;
  stocks: any[];
  errors: any[];
  go: (s: string) => void;
}) {
  const events = changes.filter((e) => saved.includes(e.symbol));
  const items = stocks.filter((s) => saved.includes(s.symbol));
  const unknown = new Set([
    ...items.filter((s) => s.status === 'INCOMPLETE').map((s) => s.symbol),
    ...errors.filter((e) => saved.includes(e.symbol)).map((e) => e.symbol),
  ]);
  return (
    <div className="saved-activity" aria-label="自選異動摘要">
      <h3>自選異動摘要</h3>
      <div className="activity-counts">
        <span>
          今日有變化<strong>{fresh ? events.length : '待更新'}</strong>
        </span>
        <span>
          接近觀察區
          <strong>
            {items.filter((s) => s.status === 'APPROACHING').length}
          </strong>
        </span>
        <span>
          進場條件就緒
          <strong>{items.filter((s) => s.status === 'READY').length}</strong>
        </span>
        <span>
          資料待補<strong>{unknown.size}</strong>
        </span>
      </div>
      <p className="footnote">
        進場狀態依最近一次掃描；
        {fresh
          ? '今日變化與上次有效紀錄比較。'
          : '尚未收到今天的掃描結果，暫不宣稱今日有新變化。'}
      </p>
      {!!unknown.size && <p className="footnote">資料不足或取得失敗：{[...unknown].map(ticker =>
        <button className="saved-event" key={ticker} onClick={() => go(ticker)}>{ticker} · 查看原因</button>
      )}</p>}
      {saved.filter(ticker => !items.some(s => s.symbol === ticker) && !errors.some(e => e.symbol === ticker)).length > 0 &&
        <p className="footnote">本次沒有掃描結果：{saved.filter(ticker => !items.some(s => s.symbol === ticker) && !errors.some(e => e.symbol === ticker)).map(ticker =>
          <button className="saved-event" key={ticker} onClick={() => go(ticker)}>{ticker} · 手動查詢</button>
        )}單次查詢不會加入每日掃描。</p>}
      {events.map((e) => (
        <button
          className="saved-event"
          key={e.symbol}
          onClick={() => go(e.symbol)}
        >
          <strong>{e.symbol}</strong>
          <span>{changeText(e)}</span>
          <small>
            {e.previousStatus} → {e.status}
          </small>
        </button>
      ))}
      {fresh && !events.length && (
        <p className="footnote">本次沒有已確認的自選條件變化。</p>
      )}
    </div>
  );
}
