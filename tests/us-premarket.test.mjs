import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDE_PAGES } from '../app/guides/pages.ts';
import { renderGuideDocument } from '../app/guides/document.ts';
import { FIRSTRADE_OPEN_URL } from '../app/affiliate.ts';

const REFERRAL =
  'https://www.firstrade.com/accounts/referral?im_ref=bIQJ59ginr1r';

const page = GUIDE_PAGES.find((item) => item.slug === 'us-premarket');
assert.ok(page);
assert.equal(page.path, '/tw/us-premarket');
assert.equal(
  page.title,
  '美股盤前盤後是什麼？台灣時間與注意事項｜Stocktools',
);
assert.notEqual(page.title, 'Stocktools｜美股雙重分析');
assert.match(page.description, /不是投資建議/);
assert.match(page.h1, /盤前、盤後/);

const html = renderGuideDocument(page);
assert.match(
  html,
  /<title>美股盤前盤後是什麼？台灣時間與注意事項｜Stocktools<\/title>/,
);
assert.match(
  html,
  /<h1>美股盤前、盤後是什麼？跟一般交易時段差在哪<\/h1>/,
);
assert.match(html, /<html lang="zh-Hant">/);
assert.match(html, /不是投資建議/);
assert.match(html, /FAQPage/);
assert.match(html, /href="\/tw\/us-market-hours"/);
assert.match(html, /href="\/tw\/us-order-types"/);
assert.match(html, /href="\/tw\/us-first-buy"/);
assert.match(html, /href="\/tw\/us-open-account"/);
assert.match(html, /href="\/tw\/us-etf"/);
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
  '盤前',
  '盤後',
  '一般交易',
  '台北',
  '流動性',
  '價差',
  '限價',
  '缺口',
  '複委託',
]) {
  assert.match(html, new RegExp(phrase));
}

assert.match(html, /04:00/);
assert.match(html, /09:30/);
assert.match(html, /16:00/);
assert.match(html, /20:00/);
assert.match(html, /不重複/);

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
assert.ok(
  vercel.rewrites.some(
    (entry) =>
      entry.source === '/tw/us-premarket' &&
      entry.destination === '/tw/us-premarket/index.html',
  ),
);
const catchAllIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/:path*',
);
const premarketIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/us-premarket',
);
assert.ok(premarketIndex >= 0 && premarketIndex < catchAllIndex);
assert.ok(
  vercel.redirects.some(
    (entry) =>
      entry.source === '/tw/premarket' &&
      entry.destination === '/tw/us-premarket' &&
      entry.permanent === true,
  ),
);

const publicSitemap = readFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  'utf8',
);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-premarket/);

console.log(
  'US premarket guide passed: unique TW title, Taipei windows, friction, FAQ, Firstrade CTA, rewrite before SPA catch-all.',
);
