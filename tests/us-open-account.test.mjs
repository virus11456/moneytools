import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDE_PAGES } from '../app/guides/pages.ts';
import { renderGuideDocument } from '../app/guides/document.ts';
import { FIRSTRADE_OPEN_URL } from '../app/affiliate.ts';

const REFERRAL =
  'https://www.firstrade.com/accounts/referral?im_ref=bIQJ59ginr1r';

const page = GUIDE_PAGES.find((item) => item.slug === 'us-open-account');
assert.ok(page);
assert.equal(page.path, '/tw/us-open-account');
assert.equal(
  page.title,
  '台灣怎麼開美股帳戶：步驟、文件與複委託｜Stocktools',
);
assert.notEqual(page.title, 'Stocktools｜美股雙重分析');
assert.match(page.description, /不是投資建議/);
assert.match(page.h1, /開美股帳戶/);

const html = renderGuideDocument(page);
assert.match(
  html,
  /<title>台灣怎麼開美股帳戶：步驟、文件與複委託｜Stocktools<\/title>/,
);
assert.match(
  html,
  /<h1>台灣投資人怎麼開美股帳戶？從選券商到第一筆交易<\/h1>/,
);
assert.match(html, /<html lang="zh-Hant">/);
assert.match(html, /不是投資建議/);
assert.match(html, /不是開戶保證/);
assert.match(html, /FAQPage/);
assert.match(html, /href="\/tw\/us-broker"/);
assert.match(html, /href="\/tw\/us-fee-calculator"/);
assert.match(html, /href="\/tw\/us-deposit"/);
assert.match(html, /href="\/tw\/us-tax"/);
assert.match(html, /href="\/tw\/us-etf"/);
assert.match(html, /href="\/tw\/us-market-hours"/);
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

for (const phrase of [
  '複委託',
  '線上申請',
  '護照',
  'W-8BEN',
  '入金',
  '第一筆交易',
  '身份驗證',
  '匯費',
  '語言',
]) {
  assert.match(html, new RegExp(phrase));
}

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
assert.ok(
  vercel.rewrites.some(
    (entry) =>
      entry.source === '/tw/us-open-account' &&
      entry.destination === '/tw/us-open-account/index.html',
  ),
);
const catchAllIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/:path*',
);
const openIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/us-open-account',
);
assert.ok(openIndex >= 0 && openIndex < catchAllIndex);
assert.ok(
  vercel.redirects.some(
    (entry) =>
      entry.source === '/tw/open-account' &&
      entry.destination === '/tw/us-open-account' &&
      entry.permanent === true,
  ),
);

const publicSitemap = readFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  'utf8',
);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-open-account/);

console.log(
  'US open-account guide passed: unique TW title, dual-path steps, FAQ, Firstrade CTA, rewrite before SPA catch-all.',
);
