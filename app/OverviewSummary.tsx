import { overviewSummary } from './overviewMetrics';
export function OverviewSummary({ stocks, changes, fresh, baseline, errors, sector, selectSector }: {
  stocks: any[]; changes: any[]; fresh: boolean; baseline: boolean; errors: number;
  sector: string; selectSector: (sector: string) => void;
}) {
  const summary = overviewSummary(stocks, changes);
  const confirmed = fresh && !baseline;
  return <section className="panel overview-summary" aria-label="每日重點與產業概覽">
    <h2>每日重點</h2>
    <p className="footnote">{!fresh ? '今天的變化尚未確認，以下產業分布沿用最近一次掃描。' : baseline ? '本次為初始基準，尚無前次紀錄可比較。' : '基本面或技術面篩選的變化；同一股票可能重複計入。'}</p>
    <div className="summary-counts">
      <a href="#daily-changes">新增符合<strong>{confirmed ? `${summary.added} 檔` : '待確認'}</strong></a>
      <a href="#daily-changes">失去符合<strong>{confirmed ? `${summary.lost} 檔` : '待確認'}</strong></a>
      <a href="#daily-changes">條件變化<strong>{confirmed ? `${summary.changed} 檔` : '待確認'}</strong></a>
    </div>
    <details>
      <summary>產業概覽 · 點選產業篩選完整清單</summary>
      <p className="footnote">基本面符合／取得結果家數，非排名。取得結果包含資料不足者；本次取得失敗 {errors} 檔未分配至產業。點選後保留其他篩選條件。</p>
      <div className="sector-summary">
        <button type="button" aria-pressed={sector === 'ALL'} onClick={() => selectSector('ALL')}>全部產業</button>
        {summary.sectors.map(s => <button type="button" key={s.name} aria-pressed={sector === s.name} onClick={() => selectSector(s.name)}>
          <span>{s.name === 'Unknown' ? '產業未提供' : s.name}</span>
          <strong>{s.qualified}／{s.total} 檔</strong>
          <small>第一區 {s.dual} · 資料不足 {s.incomplete}</small>
        </button>)}
      </div>
    </details>
  </section>;
}
