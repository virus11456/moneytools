import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDE_PAGES } from '../app/guides/pages.ts';
import { renderGuideDocument } from '../app/guides/document.ts';
import { FIRSTRADE_OPEN_URL } from '../app/affiliate.ts';

const REFERRAL =
  'https://www.firstrade.com/accounts/referral?im_ref=bIQJ59ginr1r';

const page = GUIDE_PAGES.find((item) => item.slug === 'us-earnings');
assert.ok(page);
assert.equal(page.path, '/tw/us-earnings');
assert.equal(
  page.title,
  '美股財報日與財報季：台灣投資人要知道什麼｜Stocktools',
);
assert.notEqual(page.title, 'Stocktools｜美股雙重分析');
assert.match(page.description, /不是投資建議/);
assert.match(page.h1, /財報日/);

const html = renderGuideDocument(page);
assert.match(
  html,
  /<title>美股財報日與財報季：台灣投資人要知道什麼｜Stocktools<\/title>/,
);
assert.match(
  html,
  /<h1>美股財報日是什麼？先看公布窗口，再看隔夜缺口<\/h1>/,
);
assert.match(html, /<html lang="zh-Hant">/);
assert.match(html, /不是投資建議/);
assert.match(html, /FAQPage/);
assert.match(html, /href="\/tw\/us-market-hours"/);
assert.match(html, /href="\/tw\/us-premarket"/);
assert.match(html, /href="\/tw\/us-first-buy"/);
assert.match(html, /href="\/tw\/us-order-types"/);
assert.match(html, /href="\/tw\/us-etf"/);
assert.match(html, /href="\/tw\/us-open-account"/);
assert.match(html, /firstrade\.com\/accounts\/referral\?im_ref=bIQJ59ginr1r/);
assert.match(html, /開美股帳戶/);
assert.match(html, /rel="nofollow sponsored noopener noreferrer"/);
assert.equal(FIRSTRADE_OPEN_URL, REFERRAL);
assert.doesNotMatch(html, /id="root"/);
assert.doesNotMatch(html, /interactivebrokers/i);
assert.doesNotMatch(html, /partnerId=/);
assert.doesNotMatch(html, /aff_id=/);
assert.doesNotMatch(html, /保證報酬/);
assert.doesNotMatch(html, /穩賺/);
assert.doesNotMatch(html, /必賺/);
assert.doesNotMatch(html, /推薦買/);
assert.doesNotMatch(html, /VOO|SPY|QQQ/);
assert.doesNotMatch(html, /\bAAPL\b|\bTSLA\b|\bNVDA\b/);
assert.doesNotMatch(html, /20\d{2}-\d{2}-\d{2}/);

for (const phrase of [
  '財報日',
  '財報季',
  '收盤後',
  '開盤前',
  '跳空',
  '缺口',
  '時差',
  '台北',
  '複委託',
  '海外',
]) {
  assert.match(html, new RegExp(phrase));
}

assert.match(html, /不列|不列出/);
assert.match(html, /不是交易策略|不是買賣訊號|不是進場訊號/);

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
assert.ok(
  vercel.rewrites.some(
    (entry) =>
      entry.source === '/tw/us-earnings' &&
      entry.destination === '/tw/us-earnings/index.html',
  ),
);
const catchAllIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/:path*',
);
const earningsIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/us-earnings',
);
assert.ok(earningsIndex >= 0 && earningsIndex < catchAllIndex);
assert.ok(
  vercel.redirects.some(
    (entry) =>
      entry.source === '/tw/earnings' &&
      entry.destination === '/tw/us-earnings' &&
      entry.permanent === true,
  ),
);

const publicSitemap = readFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  'utf8',
);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-earnings/);

console.log(
  'US earnings guide passed: unique TW title, AMC/BMO windows, gap friction, no calendars, FAQ, Firstrade CTA, rewrite before SPA catch-all.',
);
