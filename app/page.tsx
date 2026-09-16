import { OverviewSummary } from './OverviewSummary';
import { priceSeries, visiblePriceZone } from './priceSeries';
import { scanDuration } from './scanTiming';
import { scanProvenanceView } from './scanProvenance';
import { conditionGap, remainingConditions } from './conditionProgress';
import { AnalysisSession, emptyAnalysis } from './analysisSession';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { marketClock, type MarketCalendar } from './marketClock';
import { PriceSparkline } from './PriceSparkline';
import { DataIssues } from './DataIssues';
import { AnalysisComparison } from './AnalysisComparison';
import { FinancialReview } from './FinancialReview';
import { usePublishedSnapshot } from './usePublishedSnapshot';
import {
  ActivityHistory,
  SavedActivity,
  type ScanHistory,
} from './ActivityHistory';
import { useCardView } from './useCardView';
import { useSavedStocks } from './useSavedStocks';
import {
  Star,
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
  scanProvenance?: { trigger?: string; startedAt?: string; runId?: string; runAttempt?: string };
  methodVersion: string;
  scanDate: string;
  baseline: boolean;
  previousScanAt?: string;
  universe: string[];
  coverage: number;
  errors: any[];
  stocks: Stock[];
  retainedStocks?: Stock[];
  recovery?: {
    requested: number;
    reused: number;
    recovered: number;
    unresolved: number;
    rateLimitPauses: number;
  };
  newOpportunities: any[];
  dailyChanges?: any[];
  changeBaselineSymbols?: string[];
  universeMeta?: any;
  validCoverage?: number;
  incompleteCoverage?: number;
};
const changeLabels: Record<string, string> = {
  FUNDAMENTAL_ADDED: '新通過基本面',
  DUAL_ADDED: '新通過雙重條件',
  FUNDAMENTAL_LOST: '基本面不再符合',
  DUAL_LOST: '技術面不再符合',
  ENTRY_CHANGED: '進場狀態改變',
  CONDITIONS_CHANGED: '條件明細改變',
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
function SaveButton({
  symbol,
  saved,
  toggle,
}: {
  symbol: string;
  saved: boolean;
  toggle: (symbol: string) => void;
}) {
  return (
    <button
      className={`save-stock ${saved ? 'saved' : ''}`}
      aria-label={`${saved ? '取消收藏' : '收藏'} ${symbol}`}
      aria-pressed={saved}
      onClick={() => toggle(symbol)}
    >
      <Star size={16} fill={saved ? 'currentColor' : 'none'} />
      {saved ? '已收藏' : '收藏'}
    </button>
  );
}
function Badge({ status }: { status: string }) {
  return (
    <span className={`badge ${status.toLowerCase()}`}>
      <i />
      {status}
    </span>
  );
}
function conditionValue(c: any) {
  return c.status === 'missing'
    ? '缺漏'
    : c.key === 'revenue' ||
        c.key === 'ocf' ||
        c.key === 'fcf' ||
        c.key === 'liquidity'
      ? `$${big(c.value)}`
      : c.key === 'growth' || c.key === 'margin' || c.key === 'distance'
        ? percent(c.value)
        : c.key === 'volume' || c.key === 'rr'
          ? `${c.value.toFixed(2)} 倍`
          : c.key === 'ma50rise' || c.key === 'ma200rise'
            ? `${c.value >= 0 ? '+' : ''}${money(c.value)} 差額`
            : typeof c.value === 'number'
              ? c.value.toFixed(2)
              : '—';
}
function CheckList({ checks, stock }: { checks: any[]; stock: any }) {
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
            <strong>
              {c.label}{' '}
              <small className={`condition-status ${c.status}`}>
                {c.status === 'pass'
                  ? '通過'
                  : c.status === 'missing'
                    ? '資料不足'
                    : '未通過'}
              </small>
            </strong>
            <p>{c.detail}</p>
            {conditionGap(c, stock) && <p className="condition-gap">{conditionGap(c, stock)}</p>}
          </div>
          <span className="check-value">{conditionValue(c)}</span>
        </div>
      ))}
    </div>
  );
}
function PriceChart({ s }: { s: Stock }) {
  const series = priceSeries(s.technical.bars);
  if (!series) return <div className="empty">行情不足或不完整，至少需要兩個有效交易日才能繪圖</div>;
  const { bars: b, chartLow: lo, chartHigh: hi } = series;
  const zone = visiblePriceZone(s.entry.zoneLow, s.entry.zoneHigh, lo, hi);
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
        {zone && (
          <rect
            x="0"
            width="760"
            y={y(zone.high)}
            height={Math.max(2, y(zone.low) - y(zone.high))}
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
        <i /> 收盤價 {zone && <><b /> 日線近似成交密集區（圖內範圍）</>}
      </span>
    </div>
  );
}
function Detail({
  s,
  saved,
  toggle,
}: {
  s: Stock;
  saved: boolean;
  toggle: (symbol: string) => void;
}) {
  const e = s.entry;
  const t = s.technical;
  return (
    <>
      {s.dataStatus === 'retained' && (
        <div className="notice" role="status">
          <strong>待更新 · 以下為上次紀錄</strong>
          <p>
            本次補抓尚未成功，不能確認目前仍符合。原始取得時間{' '}
            {time(s.fetchedAt)}，行情截止 {s.technical.priceDate || '未知'}
            ；以下狀態與價位均屬歷史紀錄。
          </p>
        </div>
      )}
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
      <div className="detail-save">
        <SaveButton symbol={s.symbol} saved={saved} toggle={toggle} />
        <span>收藏於此瀏覽器</span>
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
      <FinancialReview stock={s} />
      {!!s.financialSupplements?.length && (
        <details className="panel financial-sources">
          <summary>財報補值來源 · 已核對公司年報</summary>
          <p className="footnote">
            只補相同期間的缺漏欄位。若財報期間或核對數值改變，舊補值停止套用，需重新核對。
          </p>
          {s.financialSupplements.map((item: any) => (
            <div key={item.field}>
              <p>
                <strong>
                  {item.label}：{money(item.value, 0)}
                </strong>{' '}
                · 財報期 {item.fiscalDate}
              </p>
              <p className="footnote">
                {item.note} 核對日期 {item.reviewedAt}。
              </p>
              <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                {item.sourceTitle} ↗
              </a>
            </div>
          ))}
        </details>
      )}
      <div className="analysis-grid">
        <section className="panel">
          <div className="panel-title">
            <h2>
              <span className="step">01</span> Fundamental
            </h2>
            <span>{s.fundamentals.passed ? '通過' : '尚未通過'}</span>
          </div>
          <p className="subtitle">用同一財年的數據驗證企業品質</p>
          <CheckList stock={s} checks={s.fundamentals.checks} />
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
          <CheckList stock={s} checks={t.checks} />
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
          <p className="condition-gap">距離：{conditionGap({key:'distance', value:e.distance}, s)}</p>
          <p className="condition-gap">報酬／風險：{conditionGap({key:'rr', value:e.riskReward}, s)}</p>
          {e.confirmation.length ? (
            <CheckList stock={s} checks={e.confirmation} />
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
  const { saved, storageError, toggle } = useSavedStocks();
  const { cardView, changeView, viewError } = useCardView();
  const { snapshot, refreshing, loadError, checkedAt, updateMessage, refresh } =
    usePublishedSnapshot<Snapshot>();
  const [symbol, setSymbol] = useState(route);
  const [analysis, setAnalysis] = useState(emptyAnalysis);
  const analysisSession = useRef<AnalysisSession | null>(null);
  if (!analysisSession.current)
    analysisSession.current = new AnalysisSession(setAnalysis);
  const stock = analysis.symbol === symbol ? analysis.stock : null;
  const busy = analysis.symbol === symbol && analysis.busy;
  const scanStock =
    snapshot?.stocks.find((s) => s.symbol === symbol) ||
    snapshot?.retainedStocks?.find((s) => s.symbol === symbol);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchEpoch = useRef(0);
  const listScroll = useRef(0);
  const [reviewSymbols, setReviewSymbols] = useState<string[]>([]);
  const [listQuery, setListQuery] = useState('');
  const [setupFilter, setSetupFilter] = useState('ALL');
  const [savedOnly, setSavedOnly] = useState(false);
  const [todayOnly, setTodayOnly] = useState(false);
  const [sector, setSector] = useState('ALL');
  const [sort, setSort] = useState('status');
  const [results, setResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [showRules, setShowRules] = useState(false);
  const [today, setToday] = useState(day);
  const [now, setNow] = useState(Date.now);
  const [calendar, setCalendar] = useState<MarketCalendar | null>(null);
  const [history, setHistory] = useState<ScanHistory | null>(null);
  useEffect(() => {
    const id = setInterval(() => {
      setToday(day());
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const pop = () => {
      searchEpoch.current += 1;
      setSearching(false);
      setShowSuggestions(false);
      setResults(null);
      setReviewSymbols(window.history.state?.reviewSymbols || []);
      setSymbol(route());
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    setHistory((current) =>
      current?.methodVersion === snapshot?.methodVersion ? current : null,
    );
    const controller = new AbortController();
    fetch('/data/history.json', {
      cache: 'no-cache',
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((h) => {
        if (
          h?.version === 1 &&
          h.methodVersion === snapshot?.methodVersion &&
          Array.isArray(h.events) &&
          Array.isArray(h.days)
        )
          setHistory(h);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [snapshot?.generatedAt]);
  useEffect(() => {
    fetch('/data/market-calendar.json')
      .then((r) => (r.ok ? r.json() : null))
      .then(setCalendar)
      .catch(() => setCalendar(null));
  }, [snapshot?.generatedAt]);
  useEffect(() => {
    const cached =
      snapshot?.stocks.find((s) => s.symbol === symbol) ||
      snapshot?.retainedStocks?.find((s) => s.symbol === symbol);
    analysisSession.current!.open(symbol, cached);
  }, [symbol, snapshot]);
  useEffect(() => () => analysisSession.current!.dispose(), []);
  useLayoutEffect(() => {
    window.scrollTo({
      top: symbol ? 0 : listScroll.current,
      behavior: 'instant',
    });
  }, [symbol]);
  function go(s = '', sequence: string[] = []) {
    if (!symbol && s) listScroll.current = window.scrollY;
    setReviewSymbols(sequence);
    searchEpoch.current += 1;
    setSearching(false);
    setShowSuggestions(false);
    window.history.pushState(
      { reviewSymbols: sequence },
      '',
      s ? `/stock/${encodeURIComponent(s)}` : '/',
    );
    setSymbol(s);
    setResults(null);
    setError('');
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
    const epoch = ++searchEpoch.current;
    setSearching(true);
    setShowSuggestions(false);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const d = await r.json();
      if (epoch !== searchEpoch.current) return;
      if (!r.ok) throw Error(d.error);
      if (d.results.length === 1) go(d.results[0].symbol);
      else setResults(d.results);
    } catch (e: any) {
      if (epoch !== searchEpoch.current) return;
      if (/^[A-Za-z]{1,6}(?:[.-][A-Za-z])?$/.test(query))
        go(query.toUpperCase().replace('.', '-'));
      else setError(e.message);
    } finally {
      if (epoch === searchEpoch.current) setSearching(false);
    }
  }
  const normalizedQuery = q.trim().toLowerCase().replaceAll('.', '-');
  const localSuggestions = normalizedQuery
    ? (snapshot?.stocks || [])
        .filter((s) =>
          `${s.symbol} ${s.name}`
            .toLowerCase()
            .replaceAll('.', '-')
            .includes(normalizedQuery),
        )
        .sort((a, b) => {
          const rank = (s: Stock) =>
            s.symbol.toLowerCase() === normalizedQuery
              ? 0
              : s.symbol.toLowerCase().startsWith(normalizedQuery)
                ? 1
                : 2;
          return rank(a) - rank(b) || a.symbol.localeCompare(b.symbol);
        })
    : [];
  const scheduleInfo = marketClock(calendar, now, snapshot?.generatedAt);
  const scanSource = scanProvenanceView(snapshot?.scanProvenance);
  const scanElapsed = scanDuration(snapshot?.scanProvenance?.startedAt, snapshot?.generatedAt);
  const fresh = snapshot?.scanDate === today;
  const changes = fresh ? snapshot?.dailyChanges || [] : [];
  const newToday = changes.filter((e) =>
    e.kinds.some(
      (k: string) => k === 'FUNDAMENTAL_ADDED' || k === 'DUAL_ADDED',
    ),
  );
  const statusOrder = ['READY', 'APPROACHING', 'QUALITY', 'INCOMPLETE'];
  const opportunities = (snapshot?.stocks || [])
    .filter((s) => s.fundamentals.passed)
    .sort(
      (a, b) =>
        statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status) ||
        a.symbol.localeCompare(b.symbol),
    );
  const todaySymbols = new Set(newToday.map((event) => event.symbol));
  const todayQualifiedCount = opportunities.filter((s) => todaySymbols.has(s.symbol)).length;
  const sectors = [
    ...new Set((snapshot?.stocks || []).map((s) => s.sector || 'Unknown')),
  ].sort();
  const matching = opportunities
    .filter(
      (s) =>
        (sector === 'ALL' || (s.sector || 'Unknown') === sector) &&
        (setupFilter === 'ALL' || s.status === setupFilter) &&
        (!savedOnly || saved.includes(s.symbol)) &&
        (!todayOnly || todaySymbols.has(s.symbol)) &&
        `${s.symbol} ${s.name}`
          .toLowerCase()
          .includes(listQuery.trim().toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === 'symbol') return a.symbol.localeCompare(b.symbol);
      if (sort === 'distance')
        return (
          (a.entry.distance ?? Infinity) - (b.entry.distance ?? Infinity) ||
          a.symbol.localeCompare(b.symbol)
        );
      if (sort === 'rr')
        return (
          (b.entry.riskReward ?? -Infinity) -
            (a.entry.riskReward ?? -Infinity) ||
          a.symbol.localeCompare(b.symbol)
        );
      return (
        statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status) ||
        a.symbol.localeCompare(b.symbol)
      );
    });
  const narrowed =
    !!listQuery.trim() ||
    sector !== 'ALL' ||
    setupFilter !== 'ALL' ||
    savedOnly || todayOnly;
  const groups = [
    {
      key: 'dual',
      title: '第一區｜基本面＋技術面皆符合',
      description:
        '納入條件：基本面 5 項與技術面 4 項全部通過，且資料有效。雙重通過不等於可直接進場，仍需檢查位置、量價確認與報酬／風險。',
      total: opportunities.filter((s) => s.dualPass).length,
      stocks: matching.filter((s) => s.dualPass),
    },
    {
      key: 'fundamental',
      title: '第二區｜基本面符合、技術面待確認',
      description: '納入條件：基本面 5 項全部通過，但尚未達到雙重通過；可能是技術條件未全數通過，或行情缺漏、過期而無法確認。補齊資料並通過技術條件後，才移到第一區。',
      total: opportunities.filter((s) => !s.dualPass).length,
      stocks: matching.filter((s) => !s.dualPass),
    },
  ];
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
            <Clock3 size={14} /> 美股收盤後 75 分鐘
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
              onChange={(e) => {
                searchEpoch.current += 1;
                setSearching(false);
                setQ(e.target.value);
                setResults(null);
                setError('');
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowSuggestions(false);
              }}
              autoComplete="off"
              aria-describedby="stock-search-help"
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
        <p className="footnote" id="stock-search-help">
          輸入即查已掃描股票；按搜尋可查其他美股。可用 Tab 選擇結果，Esc 收起。
        </p>
        <div className="publication-controls">
          <button type="button" onClick={() => refresh()} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            {refreshing ? '檢查中…' : '檢查最新資料'}
          </button>
          <span role="status">
            {refreshing
              ? '正在讀取已發布結果'
              : checkedAt
                ? `${updateMessage} · ${time(checkedAt)}`
                : '尚未成功檢查'}
            <small>
              開啟時每 5 分鐘檢查；只讀取已完成的結果，不會另外啟動掃描。
            </small>
          </span>
        </div>
        {loadError && (
          <div className="notice" role="alert">
            {loadError}
          </div>
        )}
        {showSuggestions && normalizedQuery && (
          <section
            className="search-results local-suggestions"
            aria-label="已掃描股票搜尋結果"
          >
            <div className="panel-title">
              <h2>
                已掃描股票{' '}
                <span className="count">{localSuggestions.length}</span>
              </h2>
              <button
                type="button"
                className="text-button"
                onClick={() => setShowSuggestions(false)}
              >
                收起結果
              </button>
            </div>
            <p className="footnote" role="status">
              {localSuggestions.length
                ? `顯示前 ${Math.min(8, localSuggestions.length)} 筆，共 ${localSuggestions.length} 筆符合文字。狀態依最近掃描，並非即時報價。`
                : '已掃描清單沒有相符公司；按搜尋可查詢其他美股。'}
            </p>
            {localSuggestions.slice(0, 8).map((s) => (
              <button
                type="button"
                key={s.symbol}
                onClick={() => go(s.symbol)}
                aria-label={`開啟 ${s.symbol} ${s.name} 分析`}
              >
                <strong>{s.symbol}</strong>
                <span>{s.name}</span>
                <Badge status={s.status} />
                <small>行情 {s.technical.priceDate || '未知'}</small>
                <ArrowUpRight size={18} />
              </button>
            ))}
          </section>
        )}
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
              所有基本面符合標的都會列出。today：今日新通過基本面或雙重條件，且行情日或財報期已更新。進場狀態切換與失去條件另列於每日變化；首筆觀察僅建立基準，資料失敗不重置狀態。
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
            <section className="publication-controls" aria-label="個股資料查詢">
              <button
                type="button"
                disabled={busy}
                onClick={() => void analysisSession.current!.refresh()}
              >
                <RefreshCw size={16} className={busy ? 'spin' : ''} />
                {busy ? '查詢中…' : '重新查詢此股票'}
              </button>
              {analysis.source === 'query' && scanStock && (
                <button
                  type="button"
                  onClick={() => analysisSession.current!.showScan(scanStock)}
                >
                  切回每日紀錄
                </button>
              )}
              <p className="footnote">
                {stock
                  ? analysis.source === 'query'
                    ? '單次查詢結果'
                    : '每日掃描紀錄'
                  : '等待個股資料'}
                {stock?.fetchedAt
                  ? ` · 取得 ${time(stock.fetchedAt)}（台北）`
                  : ''}
                。單次查詢不改動首頁清單、today
                標籤或每日變化；行情仍為完整交易日日線。
              </p>
              {analysis.symbol === symbol && analysis.error && (
                <p className="notice" role="alert">
                  {analysis.error}
                </p>
              )}
            </section>
            {stock && analysis.source === 'query' && (
              <AnalysisComparison scan={scanStock} current={stock} />
            )}
            {busy && (
              <div className="loading" role="status">
                <RefreshCw className="spin" /> 正在取得 {symbol} 的行情與財報…
              </div>
            )}
            <div className="review-navigation">
              <button onClick={() => go()}>
                <ArrowLeft size={16} />
                回到清單
              </button>
              {reviewSymbols.includes(symbol) && (
                <>
                  <span>
                    目前篩選清單 · 第 {reviewSymbols.indexOf(symbol) + 1} /{' '}
                    {reviewSymbols.length} 檔
                  </span>
                  <div className="review-arrows">
                    <button
                      disabled={reviewSymbols.indexOf(symbol) === 0}
                      onClick={() =>
                        go(
                          reviewSymbols[reviewSymbols.indexOf(symbol) - 1],
                          reviewSymbols,
                        )
                      }
                    >
                      <ArrowLeft size={16} />
                      上一檔
                    </button>
                    <button
                      disabled={
                        reviewSymbols.indexOf(symbol) ===
                        reviewSymbols.length - 1
                      }
                      onClick={() =>
                        go(
                          reviewSymbols[reviewSymbols.indexOf(symbol) + 1],
                          reviewSymbols,
                        )
                      }
                    >
                      下一檔
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
            {stock && stock.symbol === symbol && (
              <Detail
                s={stock}
                saved={saved.includes(stock.symbol)}
                toggle={toggle}
              />
            )}
            {stock && stock.symbol === symbol && (
              <ActivityHistory
                history={history}
                symbols={[symbol]}
                today={today}
                go={(s) => {
                  if (s !== symbol) go(s);
                }}
              />
            )}
            {reviewSymbols.includes(symbol) &&
              stock &&
              stock.symbol === symbol && (
                <div className="review-navigation bottom-review">
                  <button onClick={() => go()}>回到清單</button>
                  <span>
                    第 {reviewSymbols.indexOf(symbol) + 1} /{' '}
                    {reviewSymbols.length} 檔
                  </span>
                  <button
                    disabled={
                      reviewSymbols.indexOf(symbol) === reviewSymbols.length - 1
                    }
                    onClick={() =>
                      go(
                        reviewSymbols[reviewSymbols.indexOf(symbol) + 1],
                        reviewSymbols,
                      )
                    }
                  >
                    看下一檔
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
          </>
        ) : (
          <>
            {snapshot && (
              <section
                className={`freshness-strip ${(scheduleInfo ? !scheduleInfo.overdue : fresh) && !snapshot.errors.length ? '' : 'stale'}`}
                aria-label="資料更新狀態"
              >
                <div>
                  <Clock3 size={18} />
                  <strong>
                    {scheduleInfo
                      ? scheduleInfo.label
                      : fresh
                        ? snapshot.errors.length
                          ? '今日掃描：仍有資料待補'
                          : '今日掃描已完成'
                        : '目前為前次掃描'}
                  </strong>
                  <span>{time(snapshot.generatedAt)} · 台北</span>
                </div>
                <p>
                  本次更新來源：{scanSource.label}
                  {scanElapsed && <> · 本次掃描耗時 {scanElapsed}（不含部署）</>}
                  。預計排程時間不代表實際已執行；資料取得時間不等於行情日期。
                </p>
                {scanSource.runUrl && (
                  <p className="scan-evidence">
                    {scanSource.attemptLabel && <span>{scanSource.attemptLabel} · </span>}
                    <a href={scanSource.runUrl} target="_blank" rel="noopener noreferrer">
                      查看掃描紀錄（需 GitHub 權限）<ArrowUpRight size={13} aria-hidden="true" />
                    </a>
                  </p>
                )}
                <div className="market-clock-grid">
                  <div>
                    <span>下一次預計開始 · 台北</span>
                    <strong>
                      {scheduleInfo?.next
                        ? time(scheduleInfo.next.scanAt)
                        : '日曆待更新'}
                    </strong>
                  </div>
                  <div>
                    <span>最近已收盤交易日 · 美東</span>
                    <strong>
                      {scheduleInfo?.closed?.date || '尚無可用日曆'}
                    </strong>
                  </div>
                </div>
                {scheduleInfo?.overdue && (
                  <p>
                    尚未看到本次排程完成的結果，可能正在掃描、部署或延遲；目前保留上次資料。
                  </p>
                )}
                <p>
                  取得 {snapshot.coverage} / {snapshot.universe.length} 檔 ·
                  資料不足／不適用{' '}
                  {
                    snapshot.stocks.filter((s) => s.status === 'INCOMPLETE')
                      .length
                  }{' '}
                  檔 · 取得失敗 {snapshot.errors.length}{' '}
                  檔。行情為完整交易日日線，非即時報價。
                </p>
                <p className="footnote">
                  依 NYSE 交易日曆，正常收盤後 75 分鐘啟動；美國夏令期間台北
                  05:15／冬令
                  06:15，提早收盤日提前。週末及休市日跳過，掃描與部署可能延遲。
                </p>
                {snapshot.recovery && (
                  <p>
                    同日重用 {snapshot.recovery.reused} 檔 · 本次請求{' '}
                    {snapshot.recovery.requested} 檔 · 重試救回{' '}
                    {snapshot.recovery.recovered}{' '}
                    檔。重用資料保留原始取得時間；不重新標記為新機會。
                  </p>
                )}
                {!fresh && !scheduleInfo && (
                  <p>符合清單保留最近一次結果；今天的新變化尚未確認。</p>
                )}
              </section>
            )}
            {snapshot && <OverviewSummary stocks={snapshot.stocks} changes={changes} fresh={fresh}
              baseline={snapshot.baseline} errors={snapshot.errors.length} sector={sector}
              selectSector={(value) => { setSector(value); document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' }); }} />}
            <section
              className="saved-section panel"
              id="saved-stocks"
              aria-label="我的自選清單"
            >
              <div className="panel-title">
                <h2>
                  我的自選清單 <span className="count">{saved.length}</span>
                </h2>
                <Star size={18} />
              </div>
              <p className="subtitle">
                點股票旁的星號收藏，重開此瀏覽器仍會保留。收藏不會改變篩選規則，也不會自動加入每日掃描。
              </p>
              {storageError && (
                <p role="alert" className="notice">
                  {storageError}
                </p>
              )}
              {!!saved.length && (
                <SavedActivity
                  saved={saved}
                  changes={changes}
                  fresh={fresh}
                  stocks={snapshot?.stocks || []}
                  errors={snapshot?.errors || []}
                  go={go}
                />
              )}
              {saved.length ? (
                <div className="saved-grid">
                  {saved.map((ticker) => {
                    const item =
                      snapshot?.stocks.find((s) => s.symbol === ticker) ||
                      snapshot?.retainedStocks?.find(
                        (s) => s.symbol === ticker,
                      );
                    const event = newToday.find((e) => e.symbol === ticker);
                    const scanned = snapshot?.universe.includes(ticker);
                    return (
                      <article className="saved-item" key={ticker}>
                        <button
                          className="saved-open"
                          onClick={() => go(ticker)}
                        >
                          <strong>{ticker}</strong>
                          <span>{item?.name || '開啟個股分析'}</span>
                          {item ? (
                            <>
                              {item.dataStatus === 'retained' && (
                                <small className="retained-label">
                                  待更新 · 以下是上次狀態，非本次確認
                                </small>
                              )}
                              <Badge status={item.status} />
                              <small>
                                {item.fundamentals.passed
                                  ? item.dualPass
                                    ? '基本面＋技術面皆符合'
                                    : '基本面符合、技術面待確認'
                                  : '目前未通過完整篩選'}{' '}
                                · 行情 {item.technical.priceDate || '日期未知'}
                              </small>
                            </>
                          ) : (
                            <small>
                              {!snapshot
                                ? '等待每日資料載入；可點開查詢'
                                : scanned
                                  ? '本次資料取得失敗，點開重新查詢'
                                  : '不在每日掃描範圍，點開取得分析'}
                            </small>
                          )}
                          {event && <span className="today-tag">today</span>}
                        </button>
                        <SaveButton
                          symbol={ticker}
                          saved={true}
                          toggle={toggle}
                        />
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="saved-empty">
                  尚未收藏股票。可以先搜尋想追蹤的公司，或在下方清單點「收藏」。
                </p>
              )}
              <p className="footnote">
                收藏只儲存在此裝置的瀏覽器，不會跨裝置同步；清除網站資料會移除收藏。
              </p>
            </section>
            {!!saved.length && (
              <details className="saved-history">
                <summary>自選近 30 天紀錄</summary>
                <ActivityHistory
                  history={history}
                  symbols={saved}
                  today={today}
                  go={go}
                  title="自選近期變化紀錄"
                />
              </details>
            )}

            {!!snapshot?.retainedStocks?.filter((s) => s.fundamentals.passed)
              .length && (
              <section
                className="panel retained-section"
                aria-label="待補資料的上次符合紀錄"
              >
                <h2>
                  待補資料 · 上次符合{' '}
                  <span className="count">
                    {
                      snapshot.retainedStocks.filter(
                        (s) => s.fundamentals.passed,
                      ).length
                    }
                  </span>
                </h2>
                <p className="subtitle">
                  以下股票補抓尚未成功，保留上次紀錄供追蹤；不算入本次符合總數，也不標記
                  today。
                </p>
                <div className="saved-grid">
                  {snapshot.retainedStocks
                    .filter((s) => s.fundamentals.passed)
                    .map((s) => (
                      <article className="saved-item" key={s.symbol}>
                        <button
                          className="saved-open"
                          onClick={() => go(s.symbol)}
                        >
                          <strong>{s.symbol}</strong>
                          <span>{s.name}</span>
                          <small className="retained-label">
                            待更新 · 上次 {s.status}
                          </small>
                          <small>
                            行情 {s.technical.priceDate || '未知'} · 原始取得{' '}
                            {time(s.fetchedAt)}
                          </small>
                        </button>
                        <SaveButton
                          symbol={s.symbol}
                          saved={saved.includes(s.symbol)}
                          toggle={toggle}
                        />
                      </article>
                    ))}
                </div>
              </section>
            )}
            <div className="section-heading" id="overview">
              <div>
                <div className="eyebrow">QUALIFYING OPPORTUNITIES</div>
                <h2>
                  基本面通過總覽{' '}
                  <span className="count">{opportunities.length}</span>
                </h2>
              </div>
              <span className="date">
                {today} <span>Asia/Taipei</span>
              </span>
            </div>
            <p className="footnote">
              列出最近一次掃描中所有基本面符合的標的，分為雙重條件通過與技術面待確認兩區。
              符合者全部列出；今日新符合 {newToday.length} 檔，以 today 標記。
              {snapshot &&
                !fresh &&
                ' 目前顯示前次掃描結果，請留意下方資料時間。'}
            </p>
            <section className="qualification-guide panel" aria-labelledby="qualification-guide-title">
              <h3 id="qualification-guide-title">怎麼篩選？先看基本面，再看技術面</h3>
              <p>兩區是分類，不是先通過第一區、再通過第二區。每次掃描先找出基本面通過者，再依技術面與資料有效性分流；同一檔只會列在其中一區。</p>
              <div className="qualification-guide-grid">
                <div>
                  <h4>① 基本面：以下 5 項都要符合</h4>
                  <ul>
                    <li>最近完整年度營收 ≥ 1 億美元</li>
                    <li>年度營收年增率 ≥ 15%（超過 20% 仍可通過）</li>
                    <li>營業利益率 &gt; 0</li>
                    <li>年度營業現金流 &gt; 0</li>
                    <li>自由現金流 &gt; 0（營業現金流 − 資本支出絕對值）</li>
                  </ul>
                  <p className="footnote">限美元財報，財報期距掃描日不超過 550 天；金融與不動產業暫不適用。缺資料不視為通過，嚴格大於 0 的項目等於 0 也不通過。</p>
                </div>
                <div>
                  <h4>② 技術面：以下 4 項都要符合</h4>
                  <ul>
                    <li>收盤價 &gt; 50 日均線 &gt; 200 日均線</li>
                    <li>50 日均線高於 20 個交易日前</li>
                    <li>200 日均線高於 20 個交易日前</li>
                    <li>近 20 日平均成交金額 ≥ 1,000 萬美元</li>
                  </ul>
                  <p className="footnote">完整確認需至少 220 個交易日資料，行情日期距掃描日不超過 5 個日曆日。均線相等不算通過。</p>
                </div>
              </div>
              <p><strong>分類結果：</strong>基本面通過 ＋ 技術面通過且資料有效 → 第一區；基本面通過但其餘待確認 → 第二區。基本面未通過者不列入這兩區，可到觀察池查看。</p>
              <p className="footnote">例如：營收、獲利與現金流皆達標，但均線尚未多頭排列，列第二區；之後技術面全部通過且資料有效，才移到第一區。若技術條件失效，也可能退回第二區。</p>
              <details>
                <summary>第一區還要符合什麼，才會顯示 READY？</summary>
                <p>距成交密集區上緣 ≤ 2%、報酬／風險 ≥ 2:1，且最新完整日線收盤高於前日最高價、成交量 ≥ 前 20 日平均量、當日最低價觸及區間上緣且收盤守住下緣，必須全部成立。目標使用前 63 個交易日的最高價；個股頁可查各項數值、失效價位與尚缺條件。READY 代表規則通過，不保證後續報酬。</p>
              </details>
            </section>
            {snapshot && (
              <div className="browse-tools">
                <nav className="group-nav" aria-label="快速前往">
                  <a href="#group-dual">
                    雙重符合 <b>{groups[0].total}</b>
                  </a>
                  <a href="#group-fundamental">
                    僅基本面符合 <b>{groups[1].total}</b>
                  </a>
                  <a href="#daily-changes">
                    每日變化 <b>{changes.length}</b>
                  </a>
                  <a href="#watchlist">觀察池</a>
                  <a href="#data-issues">資料問題明細</a>
                </nav>
                <div className="list-controls">
                  <label>
                    <span>篩選符合清單</span>
                    <input
                      aria-label="篩選符合清單"
                      placeholder="輸入代號或公司名"
                      value={listQuery}
                      onChange={(e) => setListQuery(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>產業</span>
                    <select
                      aria-label="篩選產業"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                    >
                      <option value="ALL">全部產業</option>
                      {sectors.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>排序</span>
                    <select
                      aria-label="符合清單排序"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="status">進場狀態優先</option>
                      <option value="symbol">代號 A–Z</option>
                      <option value="distance">距離觀察區：近到遠</option>
                      <option value="rr">報酬／風險：高到低</option>
                    </select>
                  </label>
                  <button
                    className="reset-list"
                    onClick={() => {
                      setListQuery('');
                      setSector('ALL');
                      setSort('status');
                      setSetupFilter('ALL');
                      setSavedOnly(false);
                      setTodayOnly(false);
                    }}
                  >
                    顯示全部／重設
                  </button>
                </div>
                <div
                  className="quick-filters"
                  role="group"
                  aria-label="符合清單快速篩選"
                >
                  <label className="saved-only">
                    <input type="checkbox" checked={todayOnly} onChange={(e) => setTodayOnly(e.target.checked)} />
                    只看 today 新符合（{todayQualifiedCount}）
                  </label>
                  <label className="saved-only">
                    <input
                      type="checkbox"
                      checked={savedOnly}
                      onChange={(e) => setSavedOnly(e.target.checked)}
                    />
                    只看自選
                  </label>
                  {[
                    ['ALL', '全部狀態'],
                    ['READY', 'READY · 條件就緒'],
                    ['APPROACHING', 'APPROACHING · 接近觀察區'],
                    ['QUALITY', 'QUALITY · 品質通過'],
                    ['INCOMPLETE', '資料不足'],
                  ]
                    .filter(
                      ([value]) =>
                        value !== 'INCOMPLETE' ||
                        opportunities.some((s) => s.status === value),
                    )
                    .map(([value, label]) => (
                      <button
                        key={value}
                        aria-pressed={setupFilter === value}
                        onClick={() => setSetupFilter(value)}
                      >
                        {label}{' '}
                        <b>
                          {value === 'ALL'
                            ? opportunities.length
                            : opportunities.filter((s) => s.status === value)
                                .length}
                        </b>
                      </button>
                    ))}
                </div>
                <p className="footnote">
                  狀態旁數字為全部基本面通過標的的數量；可與搜尋、產業及自選交叉篩選。QUALITY
                  可能仍在等趨勢或回撤，請查看所屬分區及條件明細。
                </p>
                {todayOnly && (
                  <p className="footnote" role="status">
                    {!fresh ? '尚無今天的掃描紀錄，today 清單暫時為空；可取消篩選查看最近符合者。'
                      : snapshot?.baseline ? '首筆掃描建立比較基準，不標記 today；可取消篩選查看全部符合者。'
                      : todayQualifiedCount === 0 ? '今天尚無新符合標的；原本符合者仍保留，取消 today 篩選即可查看。'
                      : '只顯示今日新通過基本面或雙重條件、且目前仍符合基本面的標的；可搭配其他篩選。'}
                  </p>
                )}
                {savedOnly && (
                  <p className="footnote">
                    只顯示本次基本面通過的自選股票；其餘收藏仍保留在上方「我的自選清單」。
                  </p>
                )}
                <div
                  className="card-view-controls"
                  role="group"
                  aria-label="卡片顯示方式"
                >
                  <span>卡片顯示</span>
                  <button
                    aria-pressed={cardView === 'compact'}
                    onClick={() => changeView('compact')}
                  >
                    精簡卡片
                  </button>
                  <button
                    aria-pressed={cardView === 'expanded'}
                    onClick={() => changeView('expanded')}
                  >
                    資訊卡片
                  </button>
                  <small>
                    只改變顯示方式，符合標的全數保留；偏好記在此瀏覽器。
                  </small>
                </div>
                {viewError && (
                  <p className="footnote" role="status">
                    {viewError}
                  </p>
                )}
                <p className="list-count" role="status">
                  顯示 {matching.length} / {opportunities.length}{' '}
                  檔基本面通過標的{narrowed ? ' · 已套用篩選' : ' · 全部列出'}
                  。排序僅方便比較，不代表推薦順序。迷你圖價格軸各自縮放，漲跌幅請看期間百分比。
                </p>
              </div>
            )}
            {!snapshot && !loadError ? (
              <div className="loading" role="status">
                正在載入每日掃描…
              </div>
            ) : snapshot ? (
              groups.map((group) => (
                <section
                  className="qualification-section"
                  key={group.key}
                  aria-labelledby={`group-${group.key}`}
                >
                  <div className="section-heading">
                    <div>
                      <h2 id={`group-${group.key}`}>
                        {group.title}{' '}
                        <span className="count">
                          {narrowed
                            ? `${group.stocks.length} / ${group.total}`
                            : group.total}
                        </span>
                      </h2>
                      <p className="footnote">{group.description}</p>
                    </div>
                  </div>
                  {group.stocks.length ? (
                    <div className="opportunities">
                      {group.stocks.map((s) => {
                        const added = newToday.find(
                          (event) =>
                            event.symbol === s.symbol &&
                            event.status === s.status,
                        );
                        return (
                          <article key={s.symbol} className="opportunity">
                            <button
                              className="card-open"
                              onClick={() =>
                                go(
                                  s.symbol,
                                  groups.flatMap((g) =>
                                    g.stocks.map((item) => item.symbol),
                                  ),
                                )
                              }
                              aria-label={`分析 ${s.symbol} 詳情`}
                            >
                              <div>
                                <span
                                  className={`stage-badge ${s.dualPass ? 'dual' : ''}`}
                                >
                                  {s.dualPass ? '兩階段都符合' : '第一階段符合'}
                                </span>
                                {added && (
                                  <span className="today-tag">today</span>
                                )}
                                <ArrowUpRight size={20} />
                              </div>
                              <h3>
                                {s.symbol}
                                <span>{s.name}</span>
                              </h3>

                              <span className="card-price-line">
                                <strong>{money(s.technical.price)}</strong>
                                <span
                                  className={
                                    s.technical.change == null
                                      ? 'muted'
                                      : s.technical.change >= 0
                                        ? 'positive'
                                        : 'negative'
                                  }
                                >
                                  {s.technical.change == null
                                    ? '漲跌未知'
                                    : `${s.technical.change > 0 ? '+' : ''}${percent(s.technical.change)}`}
                                </span>
                              </span>
                              {cardView === 'expanded' && (
                                <PriceSparkline
                                  symbol={s.symbol}
                                  bars={s.technical.bars}
                                />
                              )}
                            </button>
                            {cardView === 'expanded' ? (
                              <div className="card-quick-data">
                                <span
                                  className={`entry-chip ${s.status === 'READY' ? 'ready' : ''}`}
                                >
                                  <Clock3 size={13} aria-hidden="true" />
                                  {s.status === 'INCOMPLETE'
                                    ? '資料待補'
                                    : !s.dualPass
                                      ? '等待趨勢'
                                      : s.status === 'READY'
                                        ? '進場條件就緒'
                                        : s.status === 'APPROACHING'
                                          ? '接近觀察區'
                                          : '等待回撤'}
                                </span>
                                <dl>
                                  <div>
                                    <dt>距觀察區</dt>
                                    <dd>{percent(s.entry?.distance)}</dd>
                                  </div>
                                  <div>
                                    <dt>報酬／風險</dt>
                                    <dd>
                                      {s.entry?.riskReward == null
                                        ? '—'
                                        : `${s.entry.riskReward.toFixed(2)} : 1`}
                                    </dd>
                                  </div>
                                </dl>
                                <p className="card-data-date">
                                  行情 {s.technical.priceDate || '未知'} ·
                                  非即時
                                  <br />
                                  報酬／風險為歷史高點估算，不含費用
                                </p>
                              </div>
                            ) : (
                              <p className="card-data-date compact-date">
                                行情 {s.technical.priceDate || '未知'} · 非即時
                              </p>
                            )}
                            <p className="card-data-date">{remainingConditions(s)}</p>
                            <SaveButton
                              symbol={s.symbol}
                              saved={saved.includes(s.symbol)}
                              toggle={toggle}
                            />
                            <div className="stage-icons" aria-label="條件摘要">
                              <span
                                className="stage-icon passed"
                                title="第一階段：基本面通過"
                              >
                                <ShieldCheck size={17} aria-hidden="true" />
                                基本面通過
                              </span>
                              <span
                                className={`stage-icon ${s.dualPass ? 'passed' : 'pending'}`}
                                title={
                                  s.dualPass
                                    ? '第二階段：技術趨勢通過；進場條件仍需另行確認'
                                    : '第二階段：技術趨勢尚未全部通過'
                                }
                              >
                                {s.dualPass ? (
                                  <Check size={17} aria-hidden="true" />
                                ) : (
                                  <Clock3 size={17} aria-hidden="true" />
                                )}
                                {s.dualPass ? '技術面通過' : '技術面待確認'}
                              </span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>
                        {narrowed
                          ? '此區沒有符合目前篩選的標的，點「顯示全部／重設」即可恢復完整清單。'
                          : '本次掃描沒有符合此區條件的標的。'}
                      </p>
                    </div>
                  )}
                </section>
              ))
            ) : null}
            {snapshot && (
              <section
                id="daily-changes"
                className="panel daily-changes"
                aria-label="每日變化"
              >
                <div className="panel-title">
                  <h2>
                    每日變化 <span className="count">{changes.length}</span>
                  </h2>
                  <span>{today} · 台北</span>
                </div>
                <p className="subtitle">
                  同一天以首次變化前的有效紀錄比較，列出目前仍成立的變化。資料失敗或不足不當作條件失效；只有新通過基本面或雙重條件才標記
                  today。
                </p>
                {changes.length ? (
                  changes.map((e) => (
                    <button
                      className="change-row"
                      key={e.symbol}
                      onClick={() => go(e.symbol)}
                    >
                      <strong>{e.symbol}</strong>
                      <span>
                        {e.kinds
                          .map((k: string) => changeLabels[k])
                          .join(' · ')}
                      </span>
                      <span>
                        {e.previousStatus} → {e.status}
                      </span>
                      <small>{e.reasons.join(' · ')}</small>
                      <small>
                        行情比較：
                        {e.comparisonPriceDate ||
                          e.previousPriceDate ||
                          '尚無紀錄'}{' '}
                        → {e.priceDate || '尚無紀錄'} · 偵測時間{' '}
                        {time(e.detectedAt)}
                      </small>
                      {e.conditionChanges?.length ? (
                        <span className="condition-deltas">
                          {e.conditionChanges.map((c: any) => (
                            <span className="condition-delta" key={c.key}>
                              <strong>{c.label}</strong>
                              <span>
                                {c.before.status === 'pass' ? '通過' : '未通過'}{' '}
                                →{' '}
                                {c.after.status === 'pass' ? '通過' : '未通過'}
                              </span>
                              <span>
                                {conditionValue(c.before)} →{' '}
                                {conditionValue(c.after)}
                              </span>
                              <small>{c.after.detail}</small>
                            </span>
                          ))}
                        </span>
                      ) : (
                        <small>
                          尚無可比較的逐條條件紀錄；點開查看目前完整條件。
                        </small>
                      )}
                    </button>
                  ))
                ) : (
                  <p>
                    {fresh
                      ? '今天尚無已確認的條件變化，符合的標的仍全部列在上方。'
                      : '尚未取得今天的掃描；上方保留最近一次符合清單。'}
                  </p>
                )}
                {!!snapshot.changeBaselineSymbols?.length && (
                  <p className="footnote">
                    本次 {snapshot.changeBaselineSymbols.length}{' '}
                    檔首次建立比較基準；符合者照常列出，但不推定它們今天才符合。
                  </p>
                )}
              </section>
            )}
            <div className="scan-meta">
              <span>
                <RefreshCw size={14} /> 最近掃描 {time(snapshot?.generatedAt)}
              </span>
              <span>比較基準 {time(snapshot?.previousScanAt)}</span>
              <span>
                {snapshot?.coverage || 0} / {snapshot?.universe.length || 0}{' '}
                檔取得資料
              </span>
              <span>
                可完整判定{' '}
                {snapshot?.validCoverage ??
                  snapshot?.stocks.filter((s) => s.status !== 'INCOMPLETE')
                    .length ??
                  0}{' '}
                檔
              </span>
              <span>
                資料不足／不適用{' '}
                {snapshot?.incompleteCoverage ??
                  snapshot?.stocks.filter((s) => s.status === 'INCOMPLETE')
                    .length ??
                  0}{' '}
                檔 · 取得失敗 {snapshot?.errors.length || 0} 檔
              </span>
            </div>
            {snapshot && <DataIssues snapshot={snapshot} go={go} />}
            <div className="watch-heading" id="watchlist">
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
                    <th>收藏</th>
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
                        <SaveButton
                          symbol={s.symbol}
                          saved={saved.includes(s.symbol)}
                          toggle={toggle}
                        />
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
                  。保留可用的上次紀錄並標記待更新，未列為新機會。
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
            每日掃描 {snapshot?.universe.length || '—'} 檔：
            {snapshot?.universeMeta?.name || '已儲存觀察池'}，並非全美股。
            <br />
            名單取得 {time(snapshot?.universeMeta?.retrievedAt)}
            ；公開名單可能落後官方調整。{snapshot?.universeMeta?.refreshWarning}
            <br />
            年度財報有落後性；研究工具不等同買賣指令。
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
