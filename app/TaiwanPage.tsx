import { MarketStatus } from './MarketStatus';
import { SiblingNav, SimplesFingerprint } from './SiblingNav';
import { AffiliateCta } from './AffiliateCta';
import { TwGuideNav } from './TwGuideNav';
import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Search,
  Star,
} from 'lucide-react';
import './taiwan.css';
import { TaiwanHistory } from './TaiwanHistory';
type Gate = {
  key: string;
  label: string;
  value: number | null;
  status: string;
  detail: string;
  unit?: string;
};
type Stock = {
  id: string;
  symbol: string;
  name: string;
  market: string;
  industryCode: string;
  status: string;
  today: boolean;
  dualPass: boolean;
  quote: { close: number | null; date: string } | null;
  monthlyRevenue: { period: string; yoy: number | null; note?: string } | null;
  financials: { period?: string; basis?: string };
  fundamentals: { passed: boolean; checks: Gate[] };
  technical: {
    passed: boolean;
    checks: Gate[];
    bars?: { date: string; close: number }[];
    priceBasis?: string;
    source?: string;
    retrievedAt?: string;
  };
  entry: {
    available: boolean;
    passed: boolean;
    checks: Gate[];
    zoneLow?: number;
    zoneHigh?: number;
    invalidation?: number;
    target?: number;
  };
  warnings: string[];
  financialSources?: { url: string; retrievedAt: string }[];
};
type Snapshot = {
  collectionComplete?: boolean;
  generatedAt: string;
  scanDate: string;
  baseline: boolean;
  methodVersion: string;
  stocks: Stock[];
  financialCount: number;
  historyCount: number;
  counts: Record<string, number>;
  notes: string[];
  sources: Record<string, { url: string; retrievedAt: string }>;
  dailyChanges: { id: string; name: string; from: string; to: string }[];
};
const labels: Record<string, string> = {
  DUAL: '基本面＋技術面符合',
  FUNDAMENTAL: '基本面符合・等待趨勢',
  WAIT: '尚未符合基本面',
  INCOMPLETE: '資料待補齊',
};
const SAVED = 'moneytools.tw.saved.v1';
const fmt = (v: number | null | undefined, unit = '') =>
  v == null
    ? '待補資料'
    : unit === 'ratio'
      ? `${v.toFixed(2)} 倍`
      : unit === 'percent'
        ? `${(v * 100).toFixed(1)}%`
        : unit === 'TWD'
          ? Math.abs(v) >= 1e8
            ? `${(v / 1e8).toLocaleString('zh-TW', { maximumFractionDigits: 2 })} 億元`
            : `${v.toLocaleString('zh-TW', { maximumFractionDigits: 2 })} 元`
          : v.toLocaleString('zh-TW', { maximumFractionDigits: 2 });
function loadSaved(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED) || '[]');
    return Array.isArray(v)
      ? v.filter(
          (s: unknown) =>
            typeof s === 'string' && /^(TWSE|TPEX):[1-9]\d{3}$/.test(s),
        )
      : [];
  } catch {
    return [];
  }
}
function Gates({ title, checks }: { title: string; checks: Gate[] }) {
  return (
    <section className="tw-panel">
      <h2>{title}</h2>
      <div className="tw-gates">
        {checks.map((c) => (
          <div key={c.key} className="tw-gate">
            <span
              className={`tw-result ${c.status}`}
              aria-label={
                c.status === 'pass'
                  ? '通過'
                  : c.status === 'missing'
                    ? '缺資料'
                    : '未通過'
              }
            >
              {c.status === 'pass' ? (
                <Check size={17} />
              ) : c.status === 'missing' ? (
                '?'
              ) : (
                '—'
              )}
            </span>
            <div>
              <strong>{c.label}</strong>
              <p>{c.detail}</p>
            </div>
            <b>{fmt(c.value, c.unit)}</b>
          </div>
        ))}
      </div>
    </section>
  );
}
function Trend({ bars }: { bars: { date: string; close: number }[] }) {
  if (bars.length < 2) return <p className="tw-muted">歷史行情尚未補齊。</p>;
  const values = bars.map((b) => b.close),
    lo = Math.min(...values),
    hi = Math.max(...values);
  const points = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * 800},${140 - ((v - lo) / (hi - lo || 1)) * 125}`,
    )
    .join(' ');
  return (
    <figure className="tw-chart">
      <svg viewBox="0 0 800 150" role="img" aria-label="近一年還原收盤價走勢">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
      </svg>
      <figcaption>
        {bars[0].date} — {bars.at(-1)?.date} ·
        含股息與分割調整，換算至末日價格尺度
      </figcaption>
    </figure>
  );
}
export default function TaiwanPage() {
  const match = window.location.pathname.match(
    /^\/tw\/stock\/([1-9]\d{3})\/?$/,
  );
  const symbol = match?.[1];
  const invalidRoute =
    window.location.pathname != '/tw' &&
    window.location.pathname != '/tw/' &&
    !match;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [stock, setStock] = useState<Stock | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [q, setQ] = useState(''),
    [market, setMarket] = useState('ALL'),
    [onlyToday, setOnlyToday] = useState(false),
    [onlySaved, setOnlySaved] = useState(false),
    [saved, setSaved] = useState<string[]>(loadSaved),
    [saveError, setSaveError] = useState(''),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const url = symbol
      ? `/data/tw/stocks/${symbol}.json`
      : '/data/tw/dashboard.json';
    fetch(url, { signal: controller.signal, cache: 'no-cache' })
      .then(async (r) => {
        if (!r.ok)
          throw new Error(
            r.status === 404
              ? '此股票尚未收錄，或台股每日資料尚未發布。'
              : '暫時無法讀取台股資料，請稍後重試。',
          );
        const d = await r.json();
        if (symbol) {
          if (d.symbol !== symbol || !d.fundamentals)
            throw new Error('資料格式不完整');
          setStock(d);
        } else {
          if (d.market !== 'TW' || !Array.isArray(d.stocks))
            throw new Error('資料格式不完整');
          setSnapshot(d);
        }
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [symbol, refresh]);
  useEffect(() => {
    document.title = symbol
      ? `${symbol} 台股分析｜Moneytools`
      : '台股篩選｜Moneytools';
    const sync = (e: StorageEvent) => {
      if (e.key === SAVED || e.key === null) setSaved(loadSaved());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [symbol]);
  function toggle(s: Stock) {
    const next = saved.includes(s.id)
      ? saved.filter((id) => id !== s.id)
      : [...saved, s.id];
    setSaved(next);
    try {
      localStorage.setItem(SAVED, JSON.stringify(next));
      setSaveError('');
    } catch {
      setSaveError('瀏覽器無法保存收藏；重新整理後可能不保留。');
    }
  }
  function reset() {
    setQ('');
    setMarket('ALL');
    setOnlyToday(false);
    setOnlySaved(false);
  }
  const matches = (s: Stock) =>
    (market === 'ALL' || s.market === market) &&
    (!onlyToday || s.today) &&
    (!onlySaved || saved.includes(s.id)) &&
    `${s.symbol} ${s.name}`.toLowerCase().includes(q.trim().toLowerCase());
  function card(s: Stock) {
    const pending = s.fundamentals.passed
      ? s.technical.checks.filter((c) => c.status !== 'pass')
      : s.fundamentals.checks.filter((c) => c.status !== 'pass');
    return (
      <article key={s.id} className="tw-card">
        <div className="tw-card-top">
          <a href={`/tw/stock/${s.symbol}`}>
            <span className="tw-code">{s.symbol}</span>
            <h3>{s.name}</h3>
          </a>
          <button
            className={`tw-save ${saved.includes(s.id) ? 'selected' : ''}`}
            onClick={() => toggle(s)}
            aria-label={`${saved.includes(s.id) ? '取消收藏' : '收藏'} ${s.name}`}
            aria-pressed={saved.includes(s.id)}
          >
            <Star size={19} />
          </button>
        </div>
        <div className="tw-card-meta">
          <span>{s.market === 'TWSE' ? '上市' : '上櫃'}</span>
          {s.today && <span className="tw-today">today</span>}
          <span>{s.quote?.date || '行情待補'}</span>
        </div>
        <div className="tw-card-price">
          {s.quote?.close == null
            ? '—'
            : s.quote.close.toLocaleString('zh-TW', {
                maximumFractionDigits: 2,
              })}
          <small>TWD</small>
        </div>
        <p className="tw-card-state">
          {s.dualPass ? (
            <>
              <Check size={15} /> 企業與趨勢皆達標
            </>
          ) : (
            <>
              <CircleHelp size={15} /> {pending.length} 項
              {s.fundamentals.passed ? '技術' : '基本面'}條件待確認
            </>
          )}
        </p>
        <p className="tw-card-summary">
          {s.dualPass
            ? '查看條件與資料來源，再評估個別風險。'
            : pending
                .slice(0, 2)
                .map((c) => c.label)
                .join('、') || labels[s.status]}
        </p>
        <a className="tw-detail-link" href={`/tw/stock/${s.symbol}`}>
          查看分析 <ArrowUpRight size={15} />
        </a>
      </article>
    );
  }
  return (
    <div className="app tw-app">
      <header className="header">
        <div className="header-lead">
          <a className="brand" href="/tw">
            <span className="brand-icon">
              <Activity size={21} />
            </span>
            moneytools<span className="beta">TW EQUITIES</span>
          </a>
          <nav className="market-switch" aria-label="股票市場">
            <a href="/">美股</a>
            <a href="/tw" aria-current="page">
              台股
            </a>
          </nav>
          <SiblingNav />
        </div>
      </header>
      <main>
        <div className="topline">
          <span className="eyebrow">TAIWAN RESEARCH</span>
          <MarketStatus market="TW" />
        </div>
        {invalidRoute ? (
          <section className="tw-panel">
            <h1>找不到此台股頁面</h1>
            <a href="/tw">回台股首頁</a>
          </section>
        ) : symbol ? (
          <>
            <a className="tw-back" href="/tw">
              <ArrowLeft size={16} /> 回台股篩選
            </a>
            {stock && (
              <>
                <div className="tw-stock-title">
                  <div>
                    <span className="eyebrow">
                      {stock.market === 'TWSE' ? '上市' : '上櫃'} ·{' '}
                      {stock.symbol}
                    </span>
                    <h1>{stock.name}</h1>
                    <p>{labels[stock.status]}</p>
                  </div>
                  <div>
                    <strong>{fmt(stock.quote?.close, 'TWD')}</strong>
                    <p>行情 {stock.quote?.date || '待確認'}</p>
                    <button className="tw-action" onClick={() => toggle(stock)}>
                      {saved.includes(stock.id) ? '★ 已收藏' : '☆ 收藏'}
                    </button>
                  </div>
                </div>
                <section className="tw-panel">
                  <h2>價格與趨勢</h2>
                  <Trend bars={stock.technical.bars || []} />
                  <p className="tw-muted">
                    {stock.technical.source || '尚無完整歷史行情'}
                    。技術條件採還原行情，末日收盤另與官方報價核對。
                  </p>
                </section>
                <Gates title="01 企業品質" checks={stock.fundamentals.checks} />
                <Gates
                  title="02 趨勢與流動性"
                  checks={stock.technical.checks}
                />
                {stock.entry?.available && (
                  <>
                    <section className="tw-panel">
                      <h2>進場觀察</h2>
                      <p>
                        觀察區 {fmt(stock.entry.zoneLow, 'TWD')} —{' '}
                        {fmt(stock.entry.zoneHigh, 'TWD')}
                      </p>
                      <p>
                        失效價位 {fmt(stock.entry.invalidation, 'TWD')} ·
                        歷史高點 {fmt(stock.entry.target, 'TWD')}
                      </p>
                      <p>日線成交量分布近似，非真實持倉成本。</p>
                    </section>
                    <Gates
                      title={
                        stock.dualPass && stock.entry.passed
                          ? 'READY'
                          : '進場條件待確認'
                      }
                      checks={stock.entry.checks}
                    />
                  </>
                )}
                <section className="tw-panel">
                  <h2>最近月營收觀察</h2>
                  <p>
                    {stock.monthlyRevenue?.period || '待補資料'} · 年增{' '}
                    {fmt(stock.monthlyRevenue?.yoy, 'percent')}
                  </p>
                  <p className="tw-muted">
                    月營收僅供觀察；正式成長判定採近四季同比，避免單月基期與季節性影響。
                  </p>
                  {stock.monthlyRevenue?.note && (
                    <p>{stock.monthlyRevenue.note}</p>
                  )}
                </section>
                <section className="tw-panel">
                  <h2>資料與限制</h2>
                  <p>
                    財報期間：{stock.financials.period || '待補齊'} ·{' '}
                    {stock.financials.basis || '口徑待確認'} · 金額新台幣元
                  </p>
                  {stock.warnings.map((w) => (
                    <p key={w} className="tw-warning">
                      {w}
                    </p>
                  ))}
                  <p>
                    此頁為每日紀錄。重新讀取不會即時重新計算，也不會更改 today
                    或歷史。
                  </p>
                  <details>
                    <summary>
                      核對原始財報來源 <ChevronDown size={16} />
                    </summary>
                    {stock.financialSources?.map((s, i) => (
                      <p key={s.url}>
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {new URL(s.url).searchParams
                            .get('ys')
                            ?.replace(/(\d{4})(\d)/, '$1 Q$2')}{' '}
                          {new URL(s.url).searchParams.get('compareItem') ===
                          'CashflowStatement'
                            ? '現金流'
                            : '損益'}{' '}
                          ↗
                        </a>
                        <small>
                          {' '}
                          · 取得{' '}
                          {new Date(s.retrievedAt).toLocaleString('zh-TW')}
                        </small>
                      </p>
                    ))}
                  </details>
                </section>
              </>
            )}
          </>
        ) : (
          <>
            <section className="tw-intro">
              <div>
                <span className="eyebrow">台股・獨立篩選</span>
                <h1>看懂企業，等趨勢到位。</h1>
                <p>先確認成長、獲利與現金流，再用均線與流動性分流。</p>
                <TwGuideNav current="/tw" />
              </div>
              <div className="tw-date">
                {snapshot ? (
                  <>
                    <strong>{snapshot.scanDate}</strong>
                    <span>每日紀錄 · 台北時間</span>
                  </>
                ) : (
                  <span>讀取每日紀錄</span>
                )}
              </div>
            </section>
            <section className="tw-method" aria-label="台股篩選流程">
              <div className="tw-method-flow">
                <article className="tw-method-step">
                  <div className="tw-method-kicker">
                    <span>01</span> 先選企業
                  </div>
                  <h2>成長，也要有現金。</h2>
                  <p>用營收、獲利與現金流，確認企業營運品質。</p>
                  <div className="tw-method-outcome">
                    <Check size={15} /> 基本面 5 項全過，才進入兩區
                  </div>
                </article>
                <article className="tw-method-step">
                  <div className="tw-method-kicker">
                    <span>02</span> 再看趨勢
                  </div>
                  <h2>企業達標，市場跟上了嗎？</h2>
                  <p>用均線與流動性，區分趨勢已確認或仍需等待。</p>
                  <div className="tw-method-routing">
                    <span>
                      <i /> 技術面通過 <b>第一區</b>
                    </span>
                    <span>
                      <i /> 技術面待確認 <b>第二區</b>
                    </span>
                  </div>
                </article>
              </div>
              <details className="tw-method-details">
                <summary>
                  <span>查看篩選門檻</span>
                  <small>5 項基本面 · 4 項技術面</small>
                  <ChevronDown size={16} />
                </summary>
                <div className="tw-rule-columns">
                  <section className="tw-rule-sheet">
                    <h3>
                      基本面 <span>5 項全數符合</span>
                    </h3>
                    <dl className="tw-rule-list">
                      <div>
                        <dt>
                          近四季營收<small>營運規模下限</small>
                        </dt>
                        <dd>≥ 10 億元</dd>
                      </div>
                      <div>
                        <dt>
                          近四季營收年增<small>確認跨季成長</small>
                        </dt>
                        <dd>≥ 15%</dd>
                      </div>
                      <div>
                        <dt>
                          營業利益率<small>本業有獲利</small>
                        </dt>
                        <dd>&gt; 0</dd>
                      </div>
                      <div>
                        <dt>
                          營業現金流<small>營運產生現金</small>
                        </dt>
                        <dd>&gt; 0</dd>
                      </div>
                      <div>
                        <dt>
                          自由現金流<small>扣除設備等資本支出後仍有現金</small>
                        </dt>
                        <dd>&gt; 0</dd>
                      </div>
                    </dl>
                  </section>
                  <section className="tw-rule-sheet">
                    <h3>
                      技術面 <span>4 項全數符合</span>
                    </h3>
                    <dl className="tw-rule-list">
                      <div>
                        <dt>
                          均線多頭排列<small>確認價格趨勢</small>
                        </dt>
                        <dd className="tw-rule-order">
                          收盤 &gt; MA50 &gt; MA200
                        </dd>
                      </div>
                      <div>
                        <dt>
                          50 日均線<small>高於 20 個交易日前</small>
                        </dt>
                        <dd>上升</dd>
                      </div>
                      <div>
                        <dt>
                          200 日均線<small>高於 20 個交易日前</small>
                        </dt>
                        <dd>上升</dd>
                      </div>
                      <div>
                        <dt>
                          近 20 日平均成交額
                          <small>收盤價 × 成交股數近似值</small>
                        </dt>
                        <dd>≥ 2,000 萬元</dd>
                      </div>
                    </dl>
                    <p className="tw-rule-data">
                      <CircleHelp size={14} /> 至少 220
                      日行情，最新收盤須與官方核對。
                    </p>
                  </section>
                </div>
                <div className="tw-method-notes">
                  <p>
                    <strong>兩區是分類，不是關卡。</strong>
                    基本面通過後，依技術面分流；同一檔只會出現在一區。
                  </p>
                  <p>
                    財報採近四季、新台幣；金融保險與建材營造暫不適用。缺值不補零，等於
                    0 不通過嚴格大於 0 的條件。
                  </p>
                  <p>v1 研究門檻尚未回測；通過篩選不代表可立即進場。</p>
                </div>
              </details>
            </section>
            {snapshot && (
              <>
                {snapshot.collectionComplete === false && (
                  <p className="tw-warning" role="status">
                    首次財報匯入進行中。以下是本機預覽，還不是全市場最終名單。
                  </p>
                )}
                {Date.now() - Date.parse(snapshot.generatedAt) >
                  5 * 86400000 && (
                  <p className="tw-warning" role="alert">
                    這是超過五日的歷史快照，請勿視為目前篩選結果。
                  </p>
                )}
                <div className="tw-coverage">
                  <span>
                    <b>{snapshot.stocks.length.toLocaleString()}</b> 家候選
                  </span>
                  <span>
                    <b>{snapshot.financialCount.toLocaleString()}</b>{' '}
                    家有近四季營收
                  </span>
                  <span>
                    <b>{snapshot.historyCount.toLocaleString()}</b> 家有歷史行情
                  </span>
                  <span className="tw-muted">
                    {snapshot.baseline
                      ? '首次基準，不標為今日新符合'
                      : '保留所有符合者，today 僅標示本次新增'}
                  </span>
                </div>
                <div className="tw-filters">
                  <label className="tw-search">
                    <Search size={18} />
                    <input
                      aria-label="搜尋台股代號或公司名稱"
                      placeholder="搜尋代號或公司，例如 2330、台積電"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="台股市場"
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                  >
                    <option value="ALL">上市＋上櫃</option>
                    <option value="TWSE">上市</option>
                    <option value="TPEX">上櫃</option>
                  </select>
                  <label>
                    <input
                      type="checkbox"
                      checked={onlyToday}
                      onChange={(e) => setOnlyToday(e.target.checked)}
                    />{' '}
                    只看 today
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={onlySaved}
                      onChange={(e) => setOnlySaved(e.target.checked)}
                    />{' '}
                    本機收藏
                  </label>
                  <button className="tw-action" onClick={reset}>
                    重設
                  </button>
                </div>
                {(['DUAL', 'FUNDAMENTAL'] as const).map((group, i) => {
                  const all = snapshot.stocks.filter((s) => s.status === group),
                    visible = all.filter(matches);
                  return (
                    <section className="tw-group" key={group}>
                      <div className="tw-group-heading">
                        <div>
                          <span className="eyebrow">SECTION 0{i + 1}</span>
                          <h2>
                            {i === 0
                              ? '基本面＋技術面皆符合'
                              : '基本面符合，技術面待確認'}{' '}
                            <span>{all.length}</span>
                            {visible.length !== all.length && (
                              <small className="tw-muted">
                                {' '}
                                顯示 {visible.length} 檔
                              </small>
                            )}
                          </h2>
                          <p>
                            {i === 0
                              ? '企業品質與趨勢同時達標，仍需評估進場與個別風險。'
                              : '企業已達標；等待趨勢確認或行情補齊，可隨條件變化移入第一區。'}
                          </p>
                        </div>
                      </div>
                      {visible.length ? (
                        <div className="tw-grid">{visible.map(card)}</div>
                      ) : (
                        <div className="tw-empty">
                          {all.length
                            ? '沒有符合目前篩選的股票，按「重設」查看全部。'
                            : '本次尚無可確認符合者；缺資料不視為通過。'}
                        </div>
                      )}
                    </section>
                  );
                })}
                <details
                  className="tw-panel"
                  open={q.trim().length > 0 || onlySaved ? true : undefined}
                >
                  <summary>
                    觀察池與資料待確認{' '}
                    <span>
                      {
                        snapshot.stocks.filter((s) => !s.fundamentals.passed)
                          .length
                      }
                    </span>
                    <ChevronDown size={16} />
                  </summary>
                  <p className="tw-muted">
                    以下未通過基本面或資料尚未補齊，因此不列入首頁兩區。可用上方搜尋與市場篩選縮小範圍。
                  </p>
                  <div className="tw-pool">
                    {snapshot.stocks
                      .filter((s) => !s.fundamentals.passed && matches(s))
                      .map((s) => (
                        <a key={s.id} href={`/tw/stock/${s.symbol}`}>
                          <b>
                            {s.symbol} {s.name}
                          </b>
                          <span>{labels[s.status]}</span>
                          <ArrowUpRight size={14} />
                        </a>
                      ))}
                  </div>
                </details>
                <details className="tw-panel">
                  <summary>
                    本次條件變化 <span>{snapshot.dailyChanges.length}</span>
                    <ChevronDown size={16} />
                  </summary>
                  {snapshot.dailyChanges.length ? (
                    snapshot.dailyChanges.map((c) => (
                      <p key={c.id}>
                        {c.name}：{labels[c.from]} → {labels[c.to]}
                      </p>
                    ))
                  ) : (
                    <p>本次無可比較的分類變化。</p>
                  )}
                </details>
                <TaiwanHistory />
                <details className="tw-panel">
                  <summary>
                    來源、更新時間與研究限制 <ChevronDown size={16} />
                  </summary>
                  <p>
                    快照產生：
                    {new Date(snapshot.generatedAt).toLocaleString('zh-TW')}
                    ；取得時間不代表財報或行情剛更新。
                  </p>
                  {snapshot.notes.map((n) => (
                    <p key={n}>{n}</p>
                  ))}
                  {Object.entries(snapshot.sources).map(([key, s]) => (
                    <p key={key}>
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {key} ↗
                      </a>{' '}
                      ·{' '}
                      {s.retrievedAt
                        ? new Date(s.retrievedAt).toLocaleString('zh-TW')
                        : '取得時間未記錄'}
                    </p>
                  ))}
                </details>
              </>
            )}
          </>
        )}
        {loading && (
          <p role="status" className="tw-empty">
            正在讀取台股每日紀錄…
          </p>
        )}
        {error && (
          <p role="alert" className="tw-warning">
            {error} {stock || snapshot ? '保留上次成功讀取結果。' : ''}
          </p>
        )}
        {saveError && <p role="alert">{saveError}</p>}
        <AffiliateCta />
        <div className="tw-footer">
          <div>
            <p>台股獨立研究規則 · 公開資料可查核 · 無推薦分數</p>
            <SimplesFingerprint />
          </div>
          <button
            className="tw-action"
            disabled={loading}
            onClick={() => setRefresh((n) => n + 1)}
          >
            重新讀取每日紀錄
          </button>
        </div>
      </main>
    </div>
  );
}
