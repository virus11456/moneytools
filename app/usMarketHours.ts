import { countdown } from './tradingStatus.ts';
import {
  NYSE_EARLY_CLOSES,
  NYSE_FULL_CLOSES,
  NYSE_REGULAR_CLOSE,
  NYSE_REGULAR_OPEN,
  NYSE_SOURCE_LABEL,
  NYSE_SOURCE_URL,
  NYSE_TIME_ZONE,
  NYSE_VERIFIED_AT,
  TAIPEI_TIME_ZONE,
  type NyseEarlyClose,
  type NyseFullClose,
} from './calendars/nyse-holidays.ts';

export {
  NYSE_EARLY_CLOSES,
  NYSE_FULL_CLOSES,
  NYSE_SOURCE_LABEL,
  NYSE_SOURCE_URL,
  NYSE_TIME_ZONE,
  NYSE_VERIFIED_AT,
  TAIPEI_TIME_ZONE,
};

const KNOWN_YEARS = Object.keys(NYSE_FULL_CLOSES)
  .map(Number)
  .sort((a, b) => a - b);

export function calendarYears(): { fromYear: number; throughYear: number } {
  return { fromYear: KNOWN_YEARS[0], throughYear: KNOWN_YEARS.at(-1)! };
}

export function ymdInZone(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ms);
}

function zoneParts(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(ms));
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function wallUtc(
  ymd: string,
  hour: number,
  minute: number,
  second: number,
): number {
  const [year, month, day] = ymd.split('-').map(Number);
  return Date.UTC(year, month - 1, day, hour, minute, second);
}

/** Convert a civil time in `timeZone` to epoch milliseconds. */
export function zonedUtc(
  ymd: string,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  let utc = wallUtc(ymd, hour, minute, 0);
  for (let i = 0; i < 2; i += 1) {
    const parts = zoneParts(utc, timeZone);
    const shown = wallUtc(
      `${parts.year}-${parts.month}-${parts.day}`,
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    utc += wallUtc(ymd, hour, minute, 0) - shown;
  }
  return utc;
}

export function addDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day + days);
  return new Date(utc).toISOString().slice(0, 10);
}

export function weekdayUtc(ymd: string): number {
  return new Date(`${ymd}T00:00:00Z`).getUTCDay();
}

export function yearOfYmd(ymd: string): number {
  return Number(ymd.slice(0, 4));
}

const fullCloseByDate = new Map<string, NyseFullClose>();
const earlyCloseByDate = new Map<string, NyseEarlyClose>();
for (const year of KNOWN_YEARS) {
  for (const item of NYSE_FULL_CLOSES[year])
    fullCloseByDate.set(item.date, item);
  for (const item of NYSE_EARLY_CLOSES[year] || [])
    earlyCloseByDate.set(item.date, item);
}

export function nyseFullClose(ymd: string): NyseFullClose | undefined {
  return fullCloseByDate.get(ymd);
}

export function nyseEarlyClose(ymd: string): NyseEarlyClose | undefined {
  return earlyCloseByDate.get(ymd);
}

export type NyseSession = {
  date: string;
  openAt: number;
  closeAt: number;
  earlyClose: boolean;
};

export function nyseSessionOn(ymd: string): NyseSession | null {
  const year = yearOfYmd(ymd);
  if (year < KNOWN_YEARS[0] || year > KNOWN_YEARS.at(-1)!) return null;
  const dow = weekdayUtc(ymd);
  if (dow === 0 || dow === 6) return null;
  if (fullCloseByDate.has(ymd)) return null;
  const early = earlyCloseByDate.get(ymd);
  const close = early
    ? { hour: early.closeHour, minute: early.closeMinute }
    : NYSE_REGULAR_CLOSE;
  return {
    date: ymd,
    openAt: zonedUtc(
      ymd,
      NYSE_REGULAR_OPEN.hour,
      NYSE_REGULAR_OPEN.minute,
      NYSE_TIME_ZONE,
    ),
    closeAt: zonedUtc(ymd, close.hour, close.minute, NYSE_TIME_ZONE),
    earlyClose: !!early,
  };
}

export function nextNyseSession(
  fromYmd: string,
  inclusive = true,
): NyseSession | null {
  const { throughYear } = calendarYears();
  let ymd = inclusive ? fromYmd : addDays(fromYmd, 1);
  for (let i = 0; i < 400; i += 1) {
    if (yearOfYmd(ymd) > throughYear) return null;
    const session = nyseSessionOn(ymd);
    if (session) return session;
    ymd = addDays(ymd, 1);
  }
  return null;
}

export type UsCashEquityStatus =
  | {
      state: 'open';
      asOf: number;
      nyDate: string;
      session: NyseSession;
      nextOpenAt: number;
      nextCloseAt: number;
    }
  | {
      state: 'closed';
      asOf: number;
      nyDate: string;
      holiday?: NyseFullClose;
      weekend: boolean;
      nextSession: NyseSession;
      nextOpenAt: number;
      nextCloseAt: number;
    }
  | {
      state: 'unknown';
      asOf: number;
      nyDate: string;
    };

export function usCashEquityStatus(now: number): UsCashEquityStatus {
  if (!Number.isFinite(now)) {
    return { state: 'unknown', asOf: now, nyDate: '' };
  }
  const nyDate = ymdInZone(now, NYSE_TIME_ZONE);
  const year = yearOfYmd(nyDate);
  const { fromYear, throughYear } = calendarYears();
  if (year < fromYear || year > throughYear) {
    return { state: 'unknown', asOf: now, nyDate };
  }
  const today = nyseSessionOn(nyDate);
  if (today && now >= today.openAt && now < today.closeAt) {
    const following = nextNyseSession(nyDate, false);
    return {
      state: 'open',
      asOf: now,
      nyDate,
      session: today,
      nextOpenAt: following?.openAt ?? today.openAt,
      nextCloseAt: today.closeAt,
    };
  }
  const upcoming =
    today && now < today.openAt ? today : nextNyseSession(nyDate, false);
  if (!upcoming) return { state: 'unknown', asOf: now, nyDate };
  return {
    state: 'closed',
    asOf: now,
    nyDate,
    holiday: nyseFullClose(nyDate),
    weekend: weekdayUtc(nyDate) === 0 || weekdayUtc(nyDate) === 6,
    nextSession: upcoming,
    nextOpenAt: upcoming.openAt,
    nextCloseAt: upcoming.closeAt,
  };
}

export function formatZoned(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(ms);
}

export function dualClocks(ms: number): { taipei: string; et: string } {
  return {
    taipei: `${formatZoned(ms, TAIPEI_TIME_ZONE)}（台北）`,
    et: `${formatZoned(ms, NYSE_TIME_ZONE)}（美東）`,
  };
}

export function displayYears(now = Date.now()): number[] {
  const current = yearOfYmd(ymdInZone(now, TAIPEI_TIME_ZONE));
  const years = [current, current + 1].filter(
    (year) => year >= KNOWN_YEARS[0] && year <= KNOWN_YEARS.at(-1)!,
  );
  return years.length ? years : KNOWN_YEARS.slice(0, 2);
}

export function upcomingHolidays(
  now = Date.now(),
  years = displayYears(now),
): { date: string; nameZh: string; nameEn: string; kind: 'full' | 'early' }[] {
  const todayNy = ymdInZone(now, NYSE_TIME_ZONE);
  const rows: {
    date: string;
    nameZh: string;
    nameEn: string;
    kind: 'full' | 'early';
  }[] = [];
  for (const year of years) {
    for (const item of NYSE_FULL_CLOSES[year] || []) {
      if (item.date >= todayNy)
        rows.push({ ...item, kind: 'full', nameZh: closeLabel(item) });
    }
    for (const item of NYSE_EARLY_CLOSES[year] || []) {
      if (item.date >= todayNy)
        rows.push({
          date: item.date,
          nameZh: `${item.nameZh}（提早收盤 13:00 ET）`,
          nameEn: item.nameEn,
          kind: 'early',
        });
    }
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

function closeLabel(item: NyseFullClose): string {
  return item.observed ? `${item.nameZh}（順延）` : item.nameZh;
}

function weekdayZh(ymd: string): string {
  return ['日', '一', '二', '三', '四', '五', '六'][weekdayUtc(ymd)];
}

export function holidayTableHtml(year: number): string {
  const closes = NYSE_FULL_CLOSES[year] || [];
  const early = NYSE_EARLY_CLOSES[year] || [];
  const rows = [
    ...closes.map(
      (item) =>
        `<tr><th>${item.date}</th><td>週${weekdayZh(item.date)}</td><td>${closeLabel(item)}</td><td>全日休市</td></tr>`,
    ),
    ...early.map(
      (item) =>
        `<tr><th>${item.date}</th><td>週${weekdayZh(item.date)}</td><td>${item.nameZh}</td><td>提早收盤 13:00 ET</td></tr>`,
    ),
  ].sort((a, b) => a.localeCompare(b));
  if (!rows.length) {
    return `<p>${year} 年尚無已核對的 NYSE 休市表。</p>`;
  }
  return `<table class="guide-table">
  <thead>
    <tr><th>日期（美東）</th><th>星期</th><th>名稱</th><th>狀態</th></tr>
  </thead>
  <tbody>
    ${rows.join('\n    ')}
  </tbody>
</table>`;
}

export function marketHoursNowHtml(): string {
  return `<div id="us-market-now" class="market-now" data-us-market-hours>
  <div class="market-now-main market-now--pending">
    <span class="market-now-light" aria-hidden="true"></span>
    <div>
      <p class="market-now-headline" data-role="headline">開啟本頁後，會用你的裝置時間對照紐約時區，判斷現金股票現在是否在一般交易時段。</p>
      <p class="market-now-next" data-role="next">若指令碼未執行，請用下方固定時段與休市表自行對照。</p>
    </div>
  </div>
  <dl class="market-now-clocks" data-role="clocks"></dl>
  <p class="market-now-note">只計算 NYSE／Nasdaq 現金股票核心時段 09:30–16:00 ET，不含盤前、盤後。臨時停市以交易所公告為準。</p>
</div>`;
}

export function marketHoursExplainerHtml(): string {
  return `<p>美股「現在開盤嗎」對台灣使用者，指的是<strong>現金股票的一般交易時段</strong>，不是盤前競價、也不是盤後。紐約證券交易所核心時段是美東時間 <strong>09:30–16:00</strong>。</p>
<div class="guide-cards">
  <article><h3>夏令（EDT，約 3 月中–11 月初）</h3><p>開盤＝台北 <strong>21:30</strong> 當日<br>收盤＝台北 <strong>04:00</strong> 翌日</p></article>
  <article><h3>冬令（EST，約 11 月初–3 月中）</h3><p>開盤＝台北 <strong>22:30</strong> 當日<br>收盤＝台北 <strong>05:00</strong> 翌日</p></article>
</div>
<table class="guide-table">
  <thead>
    <tr><th></th><th>美東時間</th><th>台北（夏令）</th><th>台北（冬令）</th></tr>
  </thead>
  <tbody>
    <tr><th>開盤</th><td>09:30</td><td>21:30 當日</td><td>22:30 當日</td></tr>
    <tr><th>收盤</th><td>16:00</td><td>04:00 翌日</td><td>05:00 翌日</td></tr>
    <tr><th>提早收盤</th><td>13:00</td><td>01:00 翌日</td><td>02:00 翌日</td></tr>
  </tbody>
</table>
<p>美國夏令時間從 3 月第二個星期日開始、11 月第一個星期日結束。本頁用 <code>America/New_York</code> 換算，不把盤前盤後算成「開盤」。台灣複委託的下單窗口可能更短，見 <a href="/tw/us-broker">美股券商開戶</a>。買上市 ETF 的路徑見 <a href="/tw/us-etf">台灣怎麼買美股 ETF</a>。</p>`;
}

export function marketHoursHolidayHtml(now = Date.now()): string {
  const years = displayYears(now);
  const upcoming = upcomingHolidays(now, years);
  const upcomingRows = upcoming
    .slice(0, 8)
    .map(
      (item) =>
        `<tr><th>${item.date}</th><td>${item.nameZh}</td><td>${item.kind === 'full' ? '全日休市' : '提早收盤'}</td></tr>`,
    )
    .join('\n    ');
  const yearBlocks = years
    .map(
      (year) =>
        `<h3>${year} 年 NYSE 全日休市與提早收盤</h3>${holidayTableHtml(year)}`,
    )
    .join('');
  const uncovered = yearOfYmd(ymdInZone(now, TAIPEI_TIME_ZONE)) + 1;
  const note =
    uncovered > calendarYears().throughYear
      ? `<p>${calendarYears().throughYear + 1} 年以後請等交易所公布新表後再更新本頁。</p>`
      : '';
  return `<p>以下為 NYSE 已公布的<strong>全日休市</strong>與常見<strong>提早收盤</strong>（13:00 ET）。來源：<a href="${NYSE_SOURCE_URL}" rel="noreferrer">${NYSE_SOURCE_LABEL}</a>，本站核對日 ${NYSE_VERIFIED_AT}。週末本來就不交易，不重複列在表內。</p>
<p>接下來的休市／提早收盤：</p>
<table class="guide-table">
  <thead>
    <tr><th>日期（美東）</th><th>名稱</th><th>狀態</th></tr>
  </thead>
  <tbody>
    ${upcomingRows || '<tr><td colspan="3">已核對年份內沒有尚未到來的休市日。</td></tr>'}
  </tbody>
</table>
${yearBlocks}
${note}
<p>獨立紀念日、六月節、聖誕節若碰到週末，交易所會<strong>順延</strong>到相鄰星期五或星期一；表上已用「順延」標出。提早收盤常見於感恩節翌日，以及部分聖誕夜／獨立紀念日前夕。</p>`;
}

export function statusHeadline(status: UsCashEquityStatus): string {
  if (status.state === 'open') {
    const early = status.session.earlyClose ? '（今日提早收盤）' : '';
    return `美股現在開盤${early}`;
  }
  if (status.state === 'unknown') {
    return '美股時段待確認（日曆尚未覆蓋這個日期）';
  }
  if (status.holiday) {
    return `美股今日休市：${closeLabel(status.holiday)}`;
  }
  if (status.weekend) return '美股週末休市';
  return '美股現在未開盤';
}

export function statusNextLine(
  status: UsCashEquityStatus,
  now: number,
): string {
  if (status.state === 'unknown') {
    return `已核對至 ${calendarYears().throughYear} 年 NYSE 日曆。`;
  }
  if (status.state === 'open') {
    const clocks = dualClocks(status.nextCloseAt);
    return `距收盤 ${countdown(status.nextCloseAt - now)} · ${clocks.taipei} · ${clocks.et}`;
  }
  const clocks = dualClocks(status.nextOpenAt);
  return `距開盤 ${countdown(status.nextOpenAt - now)} · ${clocks.taipei} · ${clocks.et}`;
}

export function statusClockRows(
  status: UsCashEquityStatus,
): { label: string; value: string }[] {
  if (status.state === 'unknown') return [];
  if (status.state === 'open') {
    const opened = dualClocks(status.session.openAt);
    const close = dualClocks(status.nextCloseAt);
    return [
      { label: '本次開盤', value: `${opened.taipei}／${opened.et}` },
      { label: '預定收盤', value: `${close.taipei}／${close.et}` },
    ];
  }
  const open = dualClocks(status.nextOpenAt);
  const close = dualClocks(status.nextCloseAt);
  return [
    { label: '下次開盤', value: `${open.taipei}／${open.et}` },
    { label: '下次收盤', value: `${close.taipei}／${close.et}` },
  ];
}
