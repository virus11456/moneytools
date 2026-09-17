import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  addDays,
  calendarYears,
  dualClocks,
  nyseFullClose,
  nyseSessionOn,
  upcomingHolidays,
  usCashEquityStatus,
  zonedUtc,
  NYSE_FULL_CLOSES,
  NYSE_SOURCE_URL,
  NYSE_TIME_ZONE,
} from '../app/usMarketHours.ts';

const calendars = JSON.parse(
  readFileSync(
    new URL('../app/calendars/trading-sessions.json', import.meta.url),
  ),
);

const at = (instant) => usCashEquityStatus(Date.parse(instant));

assert.equal(at('2026-09-16T13:29:59Z').state, 'closed');
assert.equal(at('2026-09-16T13:30:00Z').state, 'open');
assert.equal(at('2026-09-16T20:00:00Z').state, 'closed');
assert.equal(at('2026-01-05T14:29:59Z').state, 'closed');
assert.equal(at('2026-01-05T14:30:00Z').state, 'open');
assert.equal(at('2026-03-06T14:30:00Z').state, 'open');
assert.equal(at('2026-03-09T13:30:00Z').state, 'open');
assert.equal(at('2026-11-02T13:30:00Z').state, 'closed');
assert.equal(at('2026-11-02T14:30:00Z').state, 'open');
assert.equal(at('2026-11-26T15:00:00Z').state, 'closed');
assert.equal(at('2026-11-26T15:00:00Z').holiday?.nameEn, 'Thanksgiving Day');
assert.equal(
  at('2026-11-26T15:00:00Z').nextOpenAt,
  Date.parse('2026-11-27T14:30:00Z'),
);
assert.equal(at('2026-11-27T17:59:59Z').state, 'open');
assert.equal(at('2026-11-27T18:00:00Z').state, 'closed');
assert.equal(
  at('2026-12-24T18:00:00Z').nextOpenAt,
  Date.parse('2026-12-28T14:30:00Z'),
);
assert.equal(at('2026-09-07T15:00:00Z').state, 'closed');
assert.equal(at('2026-07-03T14:30:00Z').state, 'closed');
assert.equal(at('2026-07-04T14:30:00Z').state, 'closed');
assert.equal(at('2026-12-25T15:00:00Z').state, 'closed');
assert.equal(at('2026-12-26T15:00:00Z').state, 'closed');
assert.equal(at('2026-12-26T15:00:00Z').weekend, true);

assert.equal(at('2027-01-01T15:00:00Z').state, 'closed');
assert.equal(at('2027-03-26T14:00:00Z').state, 'closed');
assert.equal(at('2027-06-18T13:30:00Z').state, 'closed');
assert.equal(at('2027-06-19T13:30:00Z').weekend, true);
assert.equal(at('2027-07-05T13:30:00Z').state, 'closed');
assert.equal(at('2027-07-06T13:30:00Z').state, 'open');
assert.equal(at('2027-12-24T14:30:00Z').state, 'closed');
assert.equal(at('2027-12-27T14:30:00Z').state, 'open');
assert.equal(at('2027-11-26T17:59:59Z').state, 'open');
assert.equal(at('2027-11-26T18:00:00Z').state, 'closed');

assert.equal(at('2025-12-31T15:00:00Z').state, 'unknown');
assert.equal(at('2029-01-02T15:00:00Z').state, 'unknown');
assert.equal(usCashEquityStatus(Number.NaN).state, 'unknown');

assert.equal(
  zonedUtc('2026-09-16', 9, 30, NYSE_TIME_ZONE),
  Date.parse('2026-09-16T13:30:00Z'),
);
assert.equal(
  zonedUtc('2026-01-05', 9, 30, NYSE_TIME_ZONE),
  Date.parse('2026-01-05T14:30:00Z'),
);
assert.equal(
  zonedUtc('2026-11-27', 13, 0, NYSE_TIME_ZONE),
  Date.parse('2026-11-27T18:00:00Z'),
);

const summerOpen = dualClocks(Date.parse('2026-09-16T13:30:00Z'));
assert.match(summerOpen.taipei, /21:30/);
assert.match(summerOpen.et, /09:30/);
const winterOpen = dualClocks(Date.parse('2026-01-05T14:30:00Z'));
assert.match(winterOpen.taipei, /22:30/);
assert.match(winterOpen.et, /09:30/);
const summerClose = dualClocks(Date.parse('2026-09-16T20:00:00Z'));
assert.match(summerClose.taipei, /04:00/);
const winterClose = dualClocks(Date.parse('2026-01-05T21:00:00Z'));
assert.match(winterClose.taipei, /05:00/);

const derived = [];
for (let ymd = '2026-01-01'; ymd.startsWith('2026'); ymd = addDays(ymd, 1)) {
  const session = nyseSessionOn(ymd);
  if (session) derived.push([session.openAt, session.closeAt]);
}
assert.equal(derived.length, calendars.US.sessions.length);
for (let i = 0; i < derived.length; i += 1) {
  assert.equal(derived[i][0], Date.parse(calendars.US.sessions[i][0]));
  assert.equal(derived[i][1], Date.parse(calendars.US.sessions[i][1]));
}

assert.ok(NYSE_FULL_CLOSES[2026].some((item) => item.date === '2026-11-26'));
assert.ok(NYSE_FULL_CLOSES[2027].some((item) => item.date === '2027-12-24'));
assert.equal(nyseFullClose('2028-01-01'), undefined);
assert.match(NYSE_SOURCE_URL, /nyse\.com/);
assert.deepEqual(calendarYears(), { fromYear: 2026, throughYear: 2028 });

const upcoming = upcomingHolidays(
  Date.parse('2026-09-17T00:00:00Z'),
  [2026, 2027],
);
assert.equal(
  upcoming.some((item) => item.date === '2026-09-07'),
  false,
);
assert.ok(upcoming.some((item) => item.date === '2026-11-26'));
assert.ok(upcoming.some((item) => item.date === '2027-01-01'));
assert.ok(
  upcoming.some((item) => item.date === '2026-11-27' && item.kind === 'early'),
);

assert.equal(
  at('2026-09-16T13:30:00Z').nextOpenAt,
  Date.parse('2026-09-17T13:30:00Z'),
);
assert.equal(
  at('2026-12-26T15:00:00Z').nextOpenAt,
  Date.parse('2026-12-28T14:30:00Z'),
);

const { GUIDE_PAGES } = await import('../app/guides/pages.ts');
const { renderGuideDocument } = await import('../app/guides/document.ts');
const page = GUIDE_PAGES.find((item) => item.slug === 'us-market-hours');
assert.ok(page);
const html = renderGuideDocument(page);
assert.match(html, /<title>美股開盤時間與休市日曆｜Stocktools<\/title>/);
assert.match(html, /<h1>美股現在開盤嗎？開盤時間與休市日曆<\/h1>/);
assert.match(html, /id="us-market-now"/);
assert.match(html, /09:30/);
assert.match(html, /16:00/);
assert.match(html, /21:30/);
assert.match(html, /22:30/);
assert.match(html, /nyse\.com\/markets\/hours-calendars/);
assert.match(html, /2026-11-26/);
assert.match(html, /2027-12-24/);
assert.match(html, /感恩節/);
assert.match(html, /href="\/tw\/us-broker"/);
assert.match(html, /firstrade\.com\/accounts\/referral\?im_ref=bIQJ59ginr1r/);

console.log(
  'US market hours passed: DST, NYSE holidays 2026–2027, early closes, Taipei clocks, 2026 session parity.',
);
