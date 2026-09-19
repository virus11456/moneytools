import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDE_PAGES } from '../app/guides/pages.ts';
import { renderGuideDocument } from '../app/guides/document.ts';
import { FIRSTRADE_OPEN_URL } from '../app/affiliate.ts';

const REFERRAL =
  'https://www.firstrade.com/accounts/referral?im_ref=bIQJ59ginr1r';

const page = GUIDE_PAGES.find((item) => item.slug === 'us-etf');
assert.ok(page);
assert.equal(page.path, '/tw/us-etf');
assert.equal(
  page.title,
  '台灣怎麼買美股 ETF：複委託與海外券商｜Stocktools',
);
assert.notEqual(page.title, 'Stocktools｜美股雙重分析');
assert.match(page.description, /不是投資建議/);
assert.match(page.h1, /美股 ETF/);

const html = renderGuideDocument(page);
assert.match(
  html,
  /<title>台灣怎麼買美股 ETF：複委託與海外券商｜Stocktools<\/title>/,
);
assert.match(
  html,
  /<h1>台灣投資人怎麼買美股 ETF？先選路徑，再看費用<\/h1>/,
);
assert.match(html, /<html lang="zh-Hant">/);
assert.match(html, /不是投資建議/);
assert.match(html, /常見標的舉例/);
assert.match(html, /不是推薦/);
assert.match(html, /FAQPage/);
assert.match(html, /href="\/tw\/us-broker"/);
assert.match(html, /href="\/tw\/us-fees"/);
assert.match(html, /href="\/tw\/us-fee-calculator"/);
assert.match(html, /href="\/tw\/us-deposit"/);
assert.match(html, /href="\/tw\/us-tax"/);
assert.match(html, /href="\/tw\/us-market-hours"/);
assert.match(html, /href="\/tw\/us-order-types"/);
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
  '美股 ETF 怎麼買',
  '最低資金',
  '手續費',
  '換成美元',
  '配息',
  '溢價',
  '折價',
  '費用率',
]) {
  assert.match(html, new RegExp(phrase));
}

assert.match(html, /VOO/);
assert.match(html, /SPY/);
assert.match(html, /QQQ/);
assert.match(html, /常見標的舉例/);
assert.doesNotMatch(html, /推薦買 VOO/);
assert.doesNotMatch(html, /一定要買/);

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
assert.ok(
  vercel.rewrites.some(
    (entry) =>
      entry.source === '/tw/us-etf' &&
      entry.destination === '/tw/us-etf/index.html',
  ),
);
const catchAllIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/:path*',
);
const etfIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/us-etf',
);
assert.ok(etfIndex >= 0 && etfIndex < catchAllIndex);
assert.ok(
  vercel.redirects.some(
    (entry) =>
      entry.source === '/tw/etf' &&
      entry.destination === '/tw/us-etf' &&
      entry.permanent === true,
  ),
);

const publicSitemap = readFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  'utf8',
);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-etf/);

console.log(
  'US ETF guide passed: unique TW title, dual-path explainer, example tickers labeled 舉例, FAQ, Firstrade CTA, rewrite before SPA catch-all.',
);
