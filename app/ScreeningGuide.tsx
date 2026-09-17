import { ShieldCheck, Activity, ChevronDown } from 'lucide-react';
import './reading.css';

/** Shared wording for both markets; pass/fail decisions still come from the backend. */
export function ScreeningGuide({ market }: { market: 'US' | 'TW' }) {
  const tw = market === 'TW';
  const period = tw ? '近四季' : '最近完整年度';
  const fundamental = [
    [`${period}營收`, tw ? '≥ 10 億新台幣' : '≥ 1 億美元', '聚焦已有營運規模的企業'],
    [`${period}營收年增率`, '≥ 15%', '確認營收成長，不設成長率上限'],
    ['營業利益率', '> 0', '確認本業有獲利'],
    [`${period}營業現金流`, '> 0', '確認營運能產生現金'],
    [`${period}自由現金流`, '> 0', '扣除資本支出後仍有現金'],
  ];
  const technical = [
    ['均線排列', '收盤價 > 50 日均線 > 200 日均線', '價格與中長期趨勢方向一致'],
    ['50 日均線', '高於 20 個交易日前', '確認中期趨勢向上'],
    ['200 日均線', '高於 20 個交易日前', '確認長期趨勢向上'],
    ['近 20 日平均成交金額', tw ? '≥ 2,000 萬新台幣' : '≥ 1,000 萬美元', '避開交易較不活躍的股票'],
  ];
  return <section className="screening-guide" aria-label={`${tw ? '台股' : '美股'}篩選流程`}>
    <div className="screening-steps">
      <div><ShieldCheck size={20} aria-hidden="true" /><div><h3><span>01</span> 基本面篩選</h3><p>營收成長、本業獲利、現金流為正。</p><small>5 項全符合，才列入以下兩區。</small></div></div>
      <div><Activity size={20} aria-hidden="true" /><div><h3><span>02</span> 技術面篩選</h3><p>確認均線向上，且交易夠活躍。</p><small>4 項全符合且資料有效 → 第一區；其餘 → 第二區。</small></div></div>
    </div>
    <div className="screening-routing"><strong>兩區是分類，沒有先後順序。</strong><span>基本面不符合者列於觀察池；通過兩項篩選後，仍須檢查進場條件。</span></div>
    <details className="screening-details">
      <summary>篩選門檻與原因 <span>5 項基本面＋4 項技術面</span><ChevronDown size={16} aria-hidden="true" /></summary>
      <div className="screening-sheets">{[["基本面篩選", fundamental], ["技術面篩選", technical]].map(([title, rows]) => <section key={title as string}><h4>{title as string}<small>每項都須符合</small></h4><dl>{(rows as string[][]).map(([name, value, why]) => <div key={name}><dt>{name}<small>{why}</small></dt><dd>{value}</dd></div>)}</dl></section>)}</div>
      <div className="screening-notes">
        <p><strong>資料也要合格：</strong>{tw ? '財報採近四季、新台幣；金融保險與建材營造暫不適用。至少 220 日行情，最新收盤須與官方核對。成交金額以收盤價 × 成交股數近似。' : '限美元財報，財報期距掃描日不超過 550 天；金融與不動產業暫不適用。至少 220 個交易日行情，行情距掃描日不超過 5 個日曆日。'}</p>
        <p>自由現金流＝營業現金流 − 資本支出絕對值。缺資料不視為符合；「&gt; 0」不含 0，均線相等也不符合。</p>
        <p>以上為研究門檻，尚未證明是最佳參數。第二區技術面確認後可移入第一區；條件失效也可能移回或退出兩區。</p>
      </div>
    </details>
    <details className="screening-details">
      <summary>篩選符合，就能進場嗎？<ChevronDown size={16} aria-hidden="true" /></summary>
      <div className="screening-notes"><p><strong>還要檢查進場條件。</strong>這是兩區分類之外的第三項檢查，評估位置、量價與報酬／風險。</p><ul><li>距成交密集區上緣 ≤ 2%，報酬／風險 ≥ 2:1。</li><li>最新完整日線收盤高於前日最高價，成交量 ≥ 前 20 日平均量。</li><li>當日最低價觸及區間上緣，且收盤守住下緣。</li></ul><p>全部成立才顯示「進場條件符合（READY）」。目標採前 63 個交易日最高價；個股頁可查數值、失效價位與尚缺條件。條件符合不保證獲利。</p></div>
    </details>
  </section>;
}
