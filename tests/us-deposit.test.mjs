import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDE_PAGES } from '../app/guides/pages.ts';
import { renderGuideDocument } from '../app/guides/document.ts';
import { FIRSTRADE_OPEN_URL } from '../app/affiliate.ts';

const REFERRAL =
  'https://www.firstrade.com/accounts/referral?im_ref=bIQJ59ginr1r';

const page = GUIDE_PAGES.find((item) => item.slug === 'us-deposit');
assert.ok(page);
assert.equal(page.path, '/tw/us-deposit');
assert.equal(
  page.title,
  '美股入金與匯款：台灣電匯到海外券商｜Stocktools',
);
assert.notEqual(page.title, 'Stocktools｜美股雙重分析');

const html = renderGuideDocument(page);
assert.match(
  html,
  /<title>美股入金與匯款：台灣電匯到海外券商｜Stocktools<\/title>/,
);
assert.match(html, /<h1>開好美股帳戶後，怎麼從台灣匯錢進去？<\/h1>/);
assert.match(html, /<html lang="zh-Hant">/);
assert.match(html, /示意/);
assert.match(html, /不是投資建議/);
assert.match(html, /不是銀行／券商報價/);
assert.match(html, /FAQPage/);
assert.match(html, /href="\/tw\/us-broker"/);
assert.match(html, /href="\/tw\/us-fees"/);
assert.match(html, /href="\/tw\/us-fee-calculator"/);
assert.match(html, /href="\/tw\/us-market-hours"/);
assert.match(html, /firstrade\.com\/accounts\/referral\?im_ref=bIQJ59ginr1r/);
assert.match(html, /開美股帳戶/);
assert.match(html, /rel="nofollow sponsored noopener noreferrer"/);
assert.equal(FIRSTRADE_OPEN_URL, REFERRAL);
assert.doesNotMatch(html, /id="root"/);
assert.doesNotMatch(html, /interactivebrokers/i);
assert.doesNotMatch(html, /partnerId=/);
assert.doesNotMatch(html, /aff_id=/);

for (const phrase of ['多久會到帳', '中間行', '最低要匯多少', '信用卡']) {
  assert.match(html, new RegExp(phrase));
}

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
assert.ok(
  vercel.rewrites.some(
    (entry) =>
      entry.source === '/tw/us-deposit' &&
      entry.destination === '/tw/us-deposit/index.html',
  ),
);
const catchAllIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/:path*',
);
const depositIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/us-deposit',
);
assert.ok(depositIndex >= 0 && depositIndex < catchAllIndex);

const publicSitemap = readFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  'utf8',
);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-deposit/);

console.log(
  'US deposit guide passed: unique TW title, wire explainer, FAQ, Firstrade CTA, rewrite before SPA catch-all.',
);
