import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDE_PAGES } from '../app/guides/pages.ts';
import { renderGuideDocument } from '../app/guides/document.ts';
import { FIRSTRADE_OPEN_URL } from '../app/affiliate.ts';

const REFERRAL =
  'https://www.firstrade.com/accounts/referral?im_ref=bIQJ59ginr1r';

const page = GUIDE_PAGES.find((item) => item.slug === 'us-first-buy');
assert.ok(page);
assert.equal(page.path, '/tw/us-first-buy');
assert.equal(
  page.title,
  '第一次買美股：複委託與海外直開路徑｜Stocktools',
);
assert.notEqual(page.title, 'Stocktools｜美股雙重分析');
assert.match(page.description, /不是投資建議/);
assert.match(page.h1, /第一次買美股/);

const html = renderGuideDocument(page);
assert.match(
  html,
  /<title>第一次買美股：複委託與海外直開路徑｜Stocktools<\/title>/,
);
assert.match(
  html,
  /<h1>第一次買美股？先看完整路徑，再點進各步驟<\/h1>/,
);
assert.match(html, /<html lang="zh-Hant">/);
assert.match(html, /不是投資建議/);
assert.match(html, /路徑總覽/);
assert.match(html, /FAQPage/);
assert.match(html, /href="\/tw\/us-open-account"/);
assert.match(html, /href="\/tw\/us-broker"/);
assert.match(html, /href="\/tw\/us-deposit"/);
assert.match(html, /href="\/tw\/us-tax"/);
assert.match(html, /href="\/tw\/us-fee-calculator"/);
assert.match(html, /href="\/tw\/us-etf"/);
assert.match(html, /href="\/tw\/us-market-hours"/);
assert.match(html, /href="\/tw\/us-dividend"/);
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
assert.doesNotMatch(html, /殖利率 \d/);
assert.doesNotMatch(html, /VOO|SPY|QQQ/);

for (const phrase of [
  '複委託',
  '海外',
  '選路徑',
  '開戶',
  'W-8BEN',
  '入金',
  '開盤',
  '第一筆',
  '費用',
  '配息',
  'ETF',
]) {
  assert.match(html, new RegExp(phrase));
}

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
assert.ok(
  vercel.rewrites.some(
    (entry) =>
      entry.source === '/tw/us-first-buy' &&
      entry.destination === '/tw/us-first-buy/index.html',
  ),
);
const catchAllIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/:path*',
);
const firstBuyIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/us-first-buy',
);
assert.ok(firstBuyIndex >= 0 && firstBuyIndex < catchAllIndex);
assert.ok(
  vercel.redirects.some(
    (entry) =>
      entry.source === '/tw/first-buy' &&
      entry.destination === '/tw/us-first-buy' &&
      entry.permanent === true,
  ),
);

const publicSitemap = readFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  'utf8',
);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-first-buy/);

console.log(
  'US first-buy hub passed: unique TW title, dual-path checklist, deep links, FAQ, Firstrade CTA, rewrite before SPA catch-all.',
);
