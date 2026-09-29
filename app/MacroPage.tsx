import { Activity, AlertCircle, ArrowUpRight, CheckCircle2, Database, Gauge, Info, LineChart as LineIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AffiliateCta } from './AffiliateCta';
import { macroCharts, macroGroups, type MacroChart } from './macroCatalog';
import { buildMacroDashboard, type MacroPayload } from './macroDashboard';
import { SiblingNav } from './SiblingNav';
import './macro.css';

const ranges = [{ label: '1年', months: 12 }, { label: '5年', months: 60 }, { label: '10年', months: 120 }, { label: '全部', months: 0 }];
const positionBarSeries = new Set(['SP500_COT', 'NASDAQ_COT']);

function MacroPlot({ chart, payload, loading }: { chart: MacroChart; payload: MacroPayload | null; loading: boolean }) {
  const [months, setMonths] = useState(120);
  const available = chart.series.filter((s) => (payload?.series[s.id]?.points?.length || 0) > 1);
  const cutoff = months ? new Date(Date.now() - months * 30.44 * 864e5).toISOString().slice(0, 10) : '';
  const rows = useMemo(() => {
    const byDate = new Map<string, Record<string, string | number>>();
    available.forEach((s) => payload?.series[s.id]?.points.forEach((p) => {
      if (cutoff && p.date < cutoff) return;
      const row = byDate.get(p.date) || { date: p.date };
      row[s.id] = p.value; byDate.set(p.date, row);
    }));
    return [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [payload, cutoff, chart.id]);
  const latest = available.map((s) => ({ s, p: payload!.series[s.id].points.at(-1)! }));
  if (loading) return <div className="macro-loading" role="status"><span className="macro-loading-bar"/><span className="macro-loading-bar short"/><strong>正在載入最新資料…</strong></div>;
  return <>
    <div className="macro-range" aria-label={`${chart.title} 圖表範圍`}>{ranges.map((r) => <button key={r.label} className={months === r.months ? 'active' : ''} onClick={() => setMonths(r.months)}>{r.label}</button>)}</div>
    {rows.length > 1 ? <div className="macro-plot"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={210}><ComposedChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
      <CartesianGrid stroke="#e2e7de" vertical={false} />
      <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={42} tickFormatter={(v) => String(v).slice(0,4)} />
      {available.map((s) => <YAxis key={s.id} yAxisId={s.id} hide domain={positionBarSeries.has(s.id)
        ? [(dataMin: number) => Math.min(0, dataMin), (dataMax: number) => Math.max(0, dataMax)]
        : ['auto','auto']} />)}
      <Tooltip labelFormatter={(v) => String(v)} formatter={(v, name) => [Number(v).toLocaleString('zh-TW',{ maximumFractionDigits: 2 }), chart.series.find((s) => s.id === name)?.label || name]} />
      {available.filter((s) => positionBarSeries.has(s.id)).map((s) => <ReferenceLine key={`${s.id}-zero`} yAxisId={s.id} y={0} stroke="#aeb8ad" strokeWidth={1} />)}
      {available.map((s) => positionBarSeries.has(s.id)
        ? <Bar key={s.id} yAxisId={s.id} dataKey={s.id} name={s.id} maxBarSize={10} isAnimationActive={false}>{rows.map((row) => <Cell key={`${s.id}-${row.date}`} fill={Number(row[s.id]) < 0 ? '#c97755' : s.color} />)}</Bar>
        : <Line key={s.id} yAxisId={s.id} type="monotone" dataKey={s.id} name={s.id} stroke={s.color} strokeWidth={2} dot={false} connectNulls={!s.id.startsWith('CBOE_PC')} isAnimationActive={false} />)}
    </ComposedChart></ResponsiveContainer></div> : <div className="macro-empty"><AlertCircle size={20}/><div><strong>資料尚未發布</strong><span>可查來源已列在下方；授權或資料管線完成後才會畫線。</span></div></div>}
    <div className="macro-latest">{latest.map(({s,p}) => <span key={s.id} style={{'--series':s.color} as React.CSSProperties}><i/>{s.label}<b>{p.value.toLocaleString('zh-TW',{maximumFractionDigits:2})} {s.unit}</b><small>{p.date}</small></span>)}</div>
  </>;
}

function ChartCard({ chart, payload, loading }: { chart: MacroChart; payload: MacroPayload | null; loading: boolean }) {
  const availableCount = chart.series.filter((s) => (payload?.series[s.id]?.points?.length || 0) > 1).length;
  return <article className="macro-card" id={chart.id}>
    <div className="macro-card-head"><span className="macro-number">{String(chart.number).padStart(2,'0')}</span><div><small>{chart.group}</small><h2>{chart.title}</h2><p>{chart.takeaway}</p></div><span className={`macro-coverage ${!loading && availableCount === chart.series.length ? 'complete' : ''}`}>{loading ? '載入中' : `${availableCount}/${chart.series.length} 可繪`}</span></div>
    <MacroPlot chart={chart} payload={payload} loading={loading}/>
    <details className="macro-details"><summary><Info size={15}/> 怎麼看、限制與資料來源</summary><div className="macro-reading"><p><b>解讀</b>{chart.explanation}</p><p><b>限制</b>{chart.caution}</p></div><div className="macro-sources">{chart.series.map((s) => <a key={s.id} href={s.sourceUrl} target="_blank" rel="noreferrer"><i style={{background:s.color}}/><span><strong>{s.label}</strong><small>{s.source} · {s.frequency}{s.formula ? ` · ${s.formula}` : ''}</small>{s.note ? <em>{s.note}</em> : null}</span><ArrowUpRight size={14}/></a>)}</div></details>
  </article>;
}

function CrossChartDashboard({ payload, loading }: { payload: MacroPayload | null; loading: boolean }) {
  const lenses = useMemo(() => buildMacroDashboard(payload), [payload]);
  const totalSeries = macroCharts.reduce((sum, chart) => sum + chart.series.length, 0);
  const availableSeries = macroCharts.reduce((sum, chart) => sum + chart.series.filter((series) => (payload?.series[series.id]?.points?.length || 0) > 1).length, 0);
  return <section className="macro-dashboard" aria-labelledby="macro-dashboard-title">
    <div className="macro-dashboard-head"><div><span className="eyebrow">CROSS-CHART VIEW</span><h2 id="macro-dashboard-title"><Gauge size={22}/> 跨圖表總經儀表</h2><p>把 20 張圖依景氣、需求、通膨與金融條件交叉核對。狀態只由下列公開規則產生；點開即可看目前值、門檻與原圖。</p></div><div className="macro-data-coverage"><strong>{loading ? '讀取中' : `${availableSeries}/${totalSeries}`}</strong><span>有資料線條</span></div></div>
    <div className="macro-lens-grid">{lenses.map((lens) => <details className={`macro-lens tone-${lens.tone}`} key={lens.id} open={false}>
      <summary><span className="macro-lens-icon">{lens.tone === 'positive' ? <CheckCircle2 size={18}/> : <Activity size={18}/>}</span><span className="macro-lens-copy"><small>{lens.title}</small><strong>{loading ? '正在讀取資料' : lens.status}</strong><em>{loading ? '載入後依公開門檻判讀' : lens.summary}</em></span><span className="macro-lens-count">{loading ? '—' : `${lens.availableCount}/${lens.evidence.length}`}<i>依據</i></span></summary>
      <div className="macro-evidence-list">{lens.evidence.map((item) => <a key={`${lens.id}-${item.label}`} className={`macro-evidence tone-${item.tone}`} href={`#${item.chartId}`}><span><i/>{item.label}<small>{item.date || '尚無資料'}</small></span><strong>{loading ? '讀取中' : item.value}</strong><p>{item.rule}</p><ArrowUpRight size={14}/></a>)}</div>
    </details>)}</div>
    <div className="macro-dashboard-note"><Info size={15}/><p><strong>怎麼判讀：</strong>每個面向至少要有 2 項資料才會形成狀態；正向或警戒訊號較多才會偏向一側，其餘顯示「分歧」。這是景氣環境整理，不是買賣建議或總分。</p></div>
  </section>;
}

export default function MacroPage() {
  const [payload, setPayload] = useState<MacroPayload | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    document.title = '美國總體經濟 20 張圖｜Stocktools';
    fetch(`/macro-data/us-macro.json?v=${Date.now()}`, { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).then(setPayload).catch(() => setError('總經資料暫時無法讀取'));
  }, []);
  return <div className="app macro-app"><header className="header"><div className="header-lead"><a className="brand" href="/"><span className="brand-icon"><Activity size={21}/></span>stocktools<span className="beta">MACRO</span></a><nav className="market-switch" aria-label="研究頁面"><a href="/">美股</a><a href="/tw">台股</a><a href="/macro" aria-current="page">美國總經</a></nav><SiblingNav/></div><AffiliateCta variant="header" locale="zh-Hant"/></header>
    <main className="macro-main"><section className="macro-hero"><span className="eyebrow">US MACRO DASHBOARD</span><h1>20 張圖，看懂美國景氣循環。</h1><p>由就業與需求、通膨與利率，一路看到市場風險與籌碼。圖表只呈現可查核資料，沒有黑箱總分。</p><div className="macro-meta"><span><Database size={15}/>資料產生 {payload?.generatedAt ? new Date(payload.generatedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}) : error || '讀取中'}</span><span><LineIcon size={15}/>{macroCharts.length} 張圖 · 缺資料明確標示</span><span>每日檢查來源；各線依日、週、月或季發布頻率更新</span></div></section>
    <CrossChartDashboard payload={payload} loading={!payload && !error}/>
    <nav className="macro-jump" aria-label="總經圖表分類">{macroGroups.map((g) => <a key={g} href={`#group-${g}`}>{g}<b>{macroCharts.filter((c) => c.group === g).length}</b></a>)}</nav>
    {macroGroups.map((g) => <section className="macro-section" key={g} id={`group-${g}`}><div className="macro-section-head"><span>{g}</span><p>{g === '景氣與需求' ? '實體經濟現在走到哪裡' : g === '通膨與利率' ? '價格壓力與資金成本如何變化' : '市場參與者正在承擔多少風險'}</p></div><div className="macro-grid">{macroCharts.filter((c) => c.group === g).map((c) => <ChartCard key={c.id} chart={c} payload={payload} loading={!payload && !error}/>)}</div></section>)}
    <section className="macro-method" id="methodology"><h2>資料方法</h2><p>Stocktools 優先使用 FRED、BLS、BEA、Census、Treasury、NY Fed、CFTC 等公開來源。年增率由本站依同頻率去年同期計算；月增或季增會在序列旁另行標示。商業調查與交易所資料若無再散布授權，只保留定義和官方連結。</p><p>不同單位的線使用各自刻度，適合看方向與轉折，不應用線條高度直接比較數值大小。資料可能修正或延遲，發布日不等於統計期間。</p></section></main>
    <footer className="macro-footer"><p>公開資料可查核 · 無投資推薦分數 · 僅供研究</p><SiblingNav variant="footer"/></footer></div>;
}
