import { useEffect, useState } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Activity,
  Clock3,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  CircleHelp,
} from 'lucide-react';

type Stock = any;
type Snapshot = {
  generatedAt: string;
  scanDate: string;
  baseline: boolean;
  previousScanAt?: string;
  universe: string[];
  coverage: number;
  errors: any[];
  stocks: Stock[];
  newOpportunities: any[];
};
const labels: Record<string, string> = {
  READY: '條件就緒',
  APPROACHING: '接近觀察區',
  QUALITY: '品質通過',
  WAIT: '繼續等待',
  INCOMPLETE: '資料不足',
};
const money = (n: number | null | undefined, d = 2) =>
  n == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: d,
      }).format(n);
const percent = (n: number | null | undefined) =>
  n == null ? '—' : `${(n * 100).toFixed(1)}%`;
const big = (n: number | null | undefined) =>
  n == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 2,
      }).format(n);
const time = (s?: string) =>
  s
    ? new Date(s).toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
        hour12: false,
      })
    : '尚無紀錄';
const day = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
const route = () =>
  decodeURIComponent(
    window.location.pathname.match(/^\/stock\/([^/]+)$/)?.[1] || '',
  );
function Badge({ status }: { status: string }) {
  return (
    <span className={`badge ${status.toLowerCase()}`}>
      <i />
      {status}
    </span>
  );
}
function CheckList({ checks }: { checks: any[] }) {
  return (
    <div className="checks">
      {checks.map((c) => (
        <div className="check" key={c.key}>
          <span className={`check-icon ${c.status}`}>
            {c.status === 'pass' ? (
              <Check size={15} />
            ) : c.status === 'missing' ? (
              <CircleHelp size={15} />
            ) : (
              <Minus size={15} />
            )}
          </span>
          <div>
            <strong>{c.label}</strong>
            <p>{c.detail}</p>
          </div>
          <span className="check-value">
            {c.status === 'missing'
              ? '缺漏'
              : c.key === 'revenue' ||
                  c.key === 'ocf' ||
                  c.key === 'fcf' ||
                  c.key === 'liquidity'
                ? `$${big(c.value)}`
                : c.key === 'growth' || c.key === 'margin'
                  ? percent(c.value)
                  : typeof c.value === 'number'
                    ? c.value.toFixed(2)
                    : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}
function PriceChart({ s }: { s: Stock }) {
  const b = s.technical.bars || [];
  if (!b.length) return <div className="empty">尚無足夠行情繪圖</div>;
  const values = b.map((x: any) => x.close);
  const lo = Math.min(...values) * 0.98,
    hi = Math.max(...values) * 1.02;
  const y = (v: number) => 220 - ((v - lo) / (hi - lo)) * 190;
  const points = b
    .map((x: any, i: number) => `${(i / (b.length - 1)) * 760},${y(x.close)}`)
    .join(' ');
  return (
    <div className="chart">
      <svg
        viewBox="0 0 820 260"
        role="img"
        aria-label={`${s.symbol} 最近 ${b.length} 個交易日收盤價與成交密集區`}
      >
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#287c64" stopOpacity=".15" />
            <stop offset="100%" stopColor="#287c64" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line
              x1="0"
              x2="760"
              y1={30 + 190 * v}
              y2={30 + 190 * v}
              stroke="#e8ebe5"
              strokeDasharray="4 4"
            />
            <text x="775" y={35 + 190 * v} fill="#8b948e" fontSize="11">
              {(hi - (hi - lo) * v).toFixed(0)}
            </text>
          </g>
        ))}
        {s.entry.zoneLow && (
          <rect
            x="0"
            width="760"
            y={y(s.entry.zoneHigh)}
            height={Math.max(2, y(s.entry.zoneLow) - y(s.entry.zoneHigh))}
            fill="#c9aa50"
            opacity=".24"
          />
        )}
        <polygon points={`0,220 ${points} 760,220`} fill="url(#fade)" />
        <polyline
          points={points}
          fill="none"
          stroke="#21765b"
          strokeWidth="2.5"
        />
        <text x="0" y="250" fill="#8b948e" fontSize="12">
          {b[0].date}
        </text>
        <text x="674" y="250" fill="#8b948e" fontSize="12">
          {b[b.length - 1].date}
        </text>
      </svg>
      <span className="chart-note">
        <i /> 收盤價 <b /> 日線近似成交密集區
      </span>
    </div>
  );
}
function Detail({ s, back }: { s: Stock; back: () => void }) {
  const e = s.entry;
  const t = s.technical;
  return (
    <>
      <button className="back" onClick={back}>
        <ArrowLeft size={16} /> 回到每日機會
      </button>
      <div className="detail-heading">
        <div>
          <div className="eyebrow">
            {s.exchange} · {s.sector}
          </div>
          <h1>
            {s.symbol} <span>{s.name}</span>
          </h1>
          <p>{s.industry}</p>
        </div>
        <div className="quote">
          <strong>{money(t.price)}</strong>
          <span className={t.change >= 0 ? 'positive' : 'negative'}>
            {percent(t.change)} <small>最近交易日</small>
          </span>
        </div>
      </div>
      <div className="decision">
        <Badge status={s.status} />
        <div>
          <strong>{labels[s.status]}</strong>
          <p>{s.reasons.join(' · ')}</p>
        </div>
      </div>
      <div className="analysis-top">
        <section className="panel">
          <div className="panel-title">
            <h2>價格與等待位置</h2>
            <span>日線 · 最近一年</span>
          </div>
          <PriceChart s={s} />
        </section>
        <section className="panel plan">
          <div className="eyebrow">ENTRY / RISK</div>
          <h2>先定義邊界，再看機會</h2>
          <dl>
            <div>
              <dt>成交密集區</dt>
              <dd>
                {money(e.zoneLow)} – {money(e.zoneHigh)}
              </dd>
            </div>
            <div>
              <dt>距離區間上緣</dt>
              <dd>{percent(e.distance)}</dd>
            </div>
            <div>
              <dt>失效價位</dt>
              <dd>{money(e.invalidation)}</dd>
            </div>
            <div>
              <dt>參考目標</dt>
              <dd>{money(e.target)}</dd>
            </div>
            <div className="rr">
              <dt>報酬 / 風險</dt>
              <dd>
                {e.riskReward == null
                  ? '不成立'
                  : `${e.riskReward.toFixed(2)} : 1`}
              </dd>
            </div>
          </dl>
          <p>
            失效價＝區間下緣 − 0.5 × ATR14。目標為前 63
            日高點，並非預測；以最新收盤計算，不含滑價與費用。
          </p>
        </section>
      </div>
      <div className="analysis-grid">
        <section className="panel">
          <div className="panel-title">
            <h2>
              <span className="step">01</span> Fundamental
            </h2>
            <span>{s.fundamentals.passed ? '通過' : '尚未通過'}</span>
          </div>
          <p className="subtitle">用同一財年的數據驗證企業品質</p>
          <CheckList checks={s.fundamentals.checks} />
          <p className="footnote">
            財報年度截止 {s.financials.fiscalDate || '未知'} · 比較{' '}
            {s.financials.previousFiscalDate || '未知'} ·{' '}
            {s.financialCurrency || '幣別未知'}
          </p>
        </section>
        <section className="panel">
          <div className="panel-title">
            <h2>
              <span className="step">02</span> Trend
            </h2>
            <span>{t.passed ? '上升趨勢確認' : '等待確認'}</span>
          </div>
          <p className="subtitle">價格、均線方向與流動性共同確認</p>
          <CheckList checks={t.checks} />
          {!t.available && <p>{t.reason}</p>}
          <p className="footnote">
            MA50 {money(t.sma50)} · MA200 {money(t.sma200)}
            <br />
            63 日回歸方向：{t.clock || '資料不足'}（僅描述）
          </p>
        </section>
        <section className="panel">
          <div className="panel-title">
            <h2>
              <span className="step">03</span> Entry & confirmation
            </h2>
          </div>
          <p className="subtitle">READY 還需距離區間 ≤ 2%、報酬 / 風險 ≥ 2</p>
          {e.confirmation.length ? (
            <CheckList checks={e.confirmation} />
          ) : (
            <div className="empty small">尚無可用的支撐成交密集區</div>
          )}
          <p className="footnote">
            126 個交易日、24
            個價位桶，以每日典型價分配整日成交量。選取目前價格下方最近、成交量至少達最大桶
            50% 的區間。這不是實際持倉或逐筆成交分布，支撐可能失效。
          </p>
        </section>
        <section className="panel">
          <div className="panel-title">
            <h2>
              <span className="step">04</span> 研究與失效條件
            </h2>
            <ShieldCheck size={18} />
          </div>
          <p className="subtitle">量化規則之外，仍需理解企業</p>
          <ul className="research">
            {s.manualReview.map((r: string) => (
              <li key={r}>{r}</li>
            ))}
            <li>
              跌破 {money(e.invalidation)}
              、趨勢轉弱或基本面不再通過，即需重新評估。
            </li>
          </ul>
          <p className="footnote">
            P/E {s.valuation.pe?.toFixed(1) || '—'} · P/S{' '}
            {s.valuation.ps?.toFixed(1) || '—'} · P/B{' '}
            {s.valuation.pb?.toFixed(1) || '—'}
            <br />
            估值僅供參考，市值與年度財報並非同一日期。
          </p>
        </section>
      </div>
      {s.warnings.length > 0 && (
        <div className="notice">{s.warnings.join('；')}</div>
      )}
      <details className="panel business">
        <summary>公司業務說明</summary>
        <p>{s.business || '來源未提供'}</p>
      </details>
      <p className="data-footer">
        行情截止 {t.priceDate || '未知'} · 取得時間 {time(s.fetchedAt)}（台北）
        · {s.source} · 規則 {s.methodVersion}
      </p>
    </>
  );
}
export default function Home() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState('');
  const [symbol, setSymbol] = useState(route);
  const [stock, setStock] = useState<Stock | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [showRules, setShowRules] = useState(false);
  const [today, setToday] = useState(day);
  useEffect(() => {
    const id = setInterval(() => setToday(day()), 60000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    fetch('/data/daily.json')
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(setSnapshot)
      .catch(() => setLoadError('尚未取得每日快照。你仍可使用搜尋查詢個股。'));
    const pop = () => setSymbol(route());
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    if (!symbol) {
      setStock(null);
      setError('');
      return;
    }
    const cached = snapshot?.stocks.find((s) => s.symbol === symbol);
    if (cached) {
      setStock(cached);
      setError('');
      setBusy(false);
      return;
    }
    const ctrl = new AbortController();
    setBusy(true);
    setError('');
    setStock(null);
    fetch(`/api/analyze?symbol=${encodeURIComponent(symbol)}`, {
      signal: ctrl.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error || '查詢失敗');
        return d;
      })
      .then(setStock)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setBusy(false);
      });
    return () => ctrl.abort();
  }, [symbol, snapshot]);
  function go(s = '') {
    window.history.pushState(
      {},
      '',
      s ? `/stock/${encodeURIComponent(s)}` : '/',
    );
    setSymbol(s);
    setResults(null);
    setError('');
    window.scrollTo(0, 0);
  }
  async function search(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setError('');
    const local =
      snapshot?.stocks.filter(
        (s) =>
          s.symbol.toLowerCase() === query.toLowerCase() ||
          s.name.toLowerCase() === query.toLowerCase(),
      ) || [];
    if (local.length === 1) {
      go(local[0].symbol);
      return;
    }
    setSearching(true);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (d.results.length === 1) go(d.results[0].symbol);
      else setResults(d.results);
    } catch (e: any) {
      if (/^[A-Za-z]{1,6}(?:[.-][A-Za-z])?$/.test(query))
        go(query.toUpperCase().replace('.', '-'));
      else setError(e.message);
    } finally {
      setSearching(false);
    }
  }
  const fresh = snapshot?.scanDate === today;
  const opportunities = fresh ? snapshot?.newOpportunities || [] : [];
  const filtered =
    snapshot?.stocks.filter((s) => filter === 'ALL' || s.status === filter) ||
    [];
  return (
    <div className="app">
      <header className="header">
        <button className="brand" onClick={() => go()}>
          <span className="brand-icon">
            <Activity size={21} />
          </span>
          moneytools<span className="beta">US EQUITIES</span>
        </button>
        <div className="header-right">
          <span className="status-dot" />
          公開資料 · 每日更新{' '}
          <button
            className="rule-button"
            onClick={() => setShowRules(!showRules)}
            aria-expanded={showRules}
          >
            <SlidersHorizontal size={16} /> 篩選規則
          </button>
        </div>
      </header>
      <main>
        <div className="topline">
          <span>
            <span className="eyebrow">RESEARCH WORKSPACE</span>{' '}
            <span className="divider">/</span> 美股雙重分析
          </span>
          <span>
            <Clock3 size={14} /> 每日 07:15 · 台北
          </span>
        </div>
        <section className="search-area">
          <div>
            <h1>好公司，等好位置。</h1>
            <p>先確認企業品質，再等待趨勢與進場條件。</p>
          </div>
          <form onSubmit={search} className="search-form">
            <Search size={21} />
            <input
              aria-label="搜尋股票代號或公司名稱"
              placeholder="搜尋股票代號或公司名稱，例如 NVDA、Apple"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={80}
            />
            <button disabled={searching} aria-label="搜尋">
              {searching ? (
                <RefreshCw size={19} className="spin" />
              ) : (
                <ArrowRight size={21} />
              )}
            </button>
          </form>
        </section>
        {results !== null && (
          <section className="search-results" aria-live="polite">
            <div className="panel-title">
              <h2>搜尋結果</h2>
              <button className="text-button" onClick={() => setResults(null)}>
                關閉
              </button>
            </div>
            {results.length ? (
              results.map((r) => (
                <button key={r.symbol} onClick={() => go(r.symbol)}>
                  <strong>{r.symbol}</strong>
                  <span>{r.name}</span>
                  <ArrowUpRight size={18} />
                </button>
              ))
            ) : (
              <p>查無符合的美股公司，請試試完整英文公司名或代號。</p>
            )}
          </section>
        )}
        {showRules && (
          <section className="rules panel">
            <h2>每個狀態，都有可檢查的條件</h2>
            <div className="rule-grid">
              <p>
                <Badge status="QUALITY" />
                年度營收 ≥ $100M、年增 ≥
                15%、營業利益率及營業／自由現金流為正。等待趨勢或回撤。
              </p>
              <p>
                <Badge status="APPROACHING" />
                品質及趨勢通過，距離成交密集區上緣 ≤
                5%。確認或報酬風險仍未全部通過。
              </p>
              <p>
                <Badge status="READY" />
                品質及趨勢通過，距離 ≤ 2%，回測與量價確認、報酬 / 風險 ≥ 2。
              </p>
            </div>
            <p>
              趨勢：收盤 &gt; MA50 &gt; MA200，兩條均線高於 20 日前，20
              日平均成交金額 ≥ $10M。財報限 550 日內、行情限 5
              個日曆日內；金融、不動產及非美元財報不適用。沒有總分，也沒有價格預測。
              <br />
              新機會：相較上次有效觀察，新進入上述狀態（包括狀態切換），且行情日或財報期已更新；首筆觀察僅建立基準，失敗不重置狀態。
            </p>
          </section>
        )}
        {error && (
          <div className="notice" role="alert">
            {error}
          </div>
        )}
        {symbol ? (
          <>
            {busy && (
              <div className="loading" role="status">
                <RefreshCw className="spin" /> 正在取得 {symbol} 的行情與財報…
              </div>
            )}
            {stock && <Detail s={stock} back={() => go()} />}
          </>
        ) : (
          <>
            <div className="section-heading">
              <div>
                <div className="eyebrow">DAILY NEW OPPORTUNITIES</div>
                <h2>
                  今日新機會{' '}
                  <span className="count">{opportunities.length}</span>
                </h2>
              </div>
              <span className="date">
                {today} <span>Asia/Taipei</span>
              </span>
            </div>
            <div className="stats">
              {['READY', 'APPROACHING', 'QUALITY'].map((status, i) => (
                <div className="stat" key={status}>
                  <div>
                    <Badge status={status} />
                    <span>{labels[status]}</span>
                  </div>
                  <strong>
                    {opportunities
                      .filter((o) => o.status === status)
                      .length.toString()
                      .padStart(2, '0')}
                  </strong>
                  <p>
                    {
                      [
                        '確認訊號與風險報酬皆通過',
                        '接近區間，等待最後確認',
                        '品質符合，耐心等待位置',
                      ][i]
                    }
                  </p>
                </div>
              ))}
            </div>
            {loadError && <div className="notice">{loadError}</div>}
            {!snapshot && !loadError ? (
              <div className="loading" role="status">
                正在載入每日掃描…
              </div>
            ) : opportunities.length ? (
              <div className="opportunities">
                {opportunities.map((o) => {
                  const s = snapshot?.stocks.find((s) => s.symbol === o.symbol);
                  return (
                    <button
                      key={o.symbol}
                      className="opportunity"
                      onClick={() => go(o.symbol)}
                    >
                      <div>
                        <Badge status={o.status} />
                        <ArrowUpRight size={20} />
                      </div>
                      <h3>
                        {o.symbol}
                        <span>{s?.name}</span>
                      </h3>
                      <p>
                        {o.previousStatus} → {o.status}
                      </p>
                      <p>{o.reasons.join(' · ')}</p>
                      <strong>{money(s?.technical.price)}</strong>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">
                  <Activity size={25} />
                </span>
                <div>
                  <h3>
                    {snapshot?.baseline
                      ? '第一份掃描，先建立比較基準'
                      : !fresh
                        ? '等待今天的掃描結果'
                        : '今天還沒有新的條件變化'}
                  </h3>
                  <p>
                    {snapshot?.baseline
                      ? '現有符合條件的股票列在下方；下次掃描開始，才會標記新進入的機會。'
                      : !fresh
                        ? '下方保留最近一次資料。過去的新機會不會冒充今天的機會。'
                        : '已符合條件的舊標的不重複推送。耐心等待，也是研究的一部分。'}
                  </p>
                </div>
                <span className="empty-label">只看新變化</span>
              </div>
            )}
            <div className="scan-meta">
              <span>
                <RefreshCw size={14} /> 最近掃描 {time(snapshot?.generatedAt)}
              </span>
              <span>比較基準 {time(snapshot?.previousScanAt)}</span>
              <span>
                {snapshot?.coverage || 0} / {snapshot?.universe.length || 40}{' '}
                檔取得資料
              </span>
            </div>
            <div className="watch-heading">
              <div>
                <h2>觀察池全覽</h2>
                <p>完整掃描結果 · 可查閱每個通過或未通過的條件</p>
              </div>
              <label className="filter">
                <SlidersHorizontal size={15} />
                <select
                  aria-label="依狀態篩選"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {[
                    'ALL',
                    'READY',
                    'APPROACHING',
                    'QUALITY',
                    'WAIT',
                    'INCOMPLETE',
                  ].map((v) => (
                    <option value={v} key={v}>
                      {v === 'ALL' ? '全部狀態' : `${v} · ${labels[v]}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>公司 / 代號</th>
                    <th>收盤價</th>
                    <th>基本面</th>
                    <th>趨勢</th>
                    <th>距離觀察區</th>
                    <th>目前狀態</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.symbol}>
                      <td>
                        <button
                          className="stock-name"
                          onClick={() => go(s.symbol)}
                        >
                          <span className="ticker-logo">
                            {s.symbol.slice(0, 2)}
                          </span>
                          <span>
                            <strong>{s.symbol}</strong>
                            <small>{s.name}</small>
                          </span>
                        </button>
                      </td>
                      <td>
                        {money(s.technical.price)}
                        <small
                          className={
                            s.technical.change >= 0 ? 'positive' : 'negative'
                          }
                        >
                          {percent(s.technical.change)}
                        </small>
                      </td>
                      <td>
                        <span
                          className={
                            s.fundamentals.passed ? 'pass-text' : 'muted'
                          }
                        >
                          {s.fundamentals.passed ? '✓ 通過' : '待確認'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={s.technical.passed ? 'pass-text' : 'muted'}
                        >
                          {s.technical.passed ? '↗ 上升' : '待確認'}
                        </span>
                      </td>
                      <td>{percent(s.entry.distance)}</td>
                      <td>
                        <Badge status={s.status} />
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`分析 ${s.symbol}`}
                          onClick={() => go(s.symbol)}
                        >
                          <ArrowUpRight size={19} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {snapshot && !filtered.length && (
                <div className="empty">目前沒有符合此狀態的股票</div>
              )}
            </div>
            {!!snapshot?.errors.length && (
              <details className="notice">
                <summary>{snapshot.errors.length} 檔本次取得失敗</summary>
                <p>
                  {snapshot.errors.map((e) => e.symbol).join('、')}
                  。保留先前狀態，未列為新機會。
                </p>
              </details>
            )}
          </>
        )}
        <footer>
          <div>
            <strong>moneytools</strong>
            <p>規則透明，判斷留給你。</p>
          </div>
          <p>
            來源：Yahoo Finance /
            yfinance（免費、非官方介面）。可能延遲、缺漏或限流。
            <br />
            每日掃描 40
            檔觀察池，並非全美股。年度財報有落後性；研究工具不等同買賣指令。
          </p>
          <a
            href="https://github.com/virus11456/moneytools"
            target="_blank"
            rel="noreferrer"
          >
            查看規則原始碼 <ArrowUpRight size={15} />
          </a>
        </footer>
      </main>
    </div>
  );
}
