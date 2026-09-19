import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDE_PAGES } from '../app/guides/pages.ts';
import { renderGuideDocument } from '../app/guides/document.ts';
import { FIRSTRADE_OPEN_URL } from '../app/affiliate.ts';

const REFERRAL =
  'https://www.firstrade.com/accounts/referral?im_ref=bIQJ59ginr1r';

const page = GUIDE_PAGES.find((item) => item.slug === 'us-order-types');
assert.ok(page);
assert.equal(page.path, '/tw/us-order-types');
assert.equal(
  page.title,
  '美股市價單 vs 限價單：滑價、部分成交與不成交｜Stocktools',
);
assert.notEqual(page.title, 'Stocktools｜美股雙重分析');
assert.match(page.description, /不是投資建議/);
assert.match(page.h1, /市價單跟限價單/);

const html = renderGuideDocument(page);
assert.match(
  html,
  /<title>美股市價單 vs 限價單：滑價、部分成交與不成交｜Stocktools<\/title>/,
);
assert.match(
  html,
  /<h1>美股市價單跟限價單差在哪？先看成交條件<\/h1>/,
);
assert.match(html, /<html lang="zh-Hant">/);
assert.match(html, /不是投資建議/);
assert.match(html, /FAQPage/);
assert.match(html, /href="\/tw\/us-first-buy"/);
assert.match(html, /href="\/tw\/us-open-account"/);
assert.match(html, /href="\/tw\/us-etf"/);
assert.match(html, /href="\/tw\/us-market-hours"/);
assert.match(html, /href="\/tw\/us-premarket"/);
assert.match(html, /href="\/tw\/us-fee-calculator"/);
assert.match(html, /href="\/tw\/us-deposit"/);
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

for (const phrase of [
  '市價單',
  '限價單',
  '滑價',
  '部分成交',
  '不成交',
  '盤前盤後',
  '複委託',
  '海外',
]) {
  assert.match(html, new RegExp(phrase));
}

assert.match(html, /不是券商操作教學|不是操作教學/);

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
assert.ok(
  vercel.rewrites.some(
    (entry) =>
      entry.source === '/tw/us-order-types' &&
      entry.destination === '/tw/us-order-types/index.html',
  ),
);
const catchAllIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/:path*',
);
const orderTypesIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/us-order-types',
);
assert.ok(orderTypesIndex >= 0 && orderTypesIndex < catchAllIndex);
assert.ok(
  vercel.redirects.some(
    (entry) =>
      entry.source === '/tw/order-types' &&
      entry.destination === '/tw/us-order-types' &&
      entry.permanent === true,
  ),
);

const publicSitemap = readFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  'utf8',
);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-order-types/);

console.log(
  'US order-types guide passed: unique TW title, market vs limit friction, FAQ, Firstrade CTA, rewrite before SPA catch-all.',
);
