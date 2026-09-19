import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDE_PAGES } from '../app/guides/pages.ts';
import { renderGuideDocument } from '../app/guides/document.ts';
import { FIRSTRADE_OPEN_URL } from '../app/affiliate.ts';

const REFERRAL =
  'https://www.firstrade.com/accounts/referral?im_ref=bIQJ59ginr1r';

const page = GUIDE_PAGES.find((item) => item.slug === 'us-adr');
assert.ok(page);
assert.equal(page.path, '/tw/us-adr');
assert.equal(
  page.title,
  '美股 ADR 是什麼？台灣投資人怎麼理解｜Stocktools',
);
assert.notEqual(page.title, 'Stocktools｜美股雙重分析');
assert.match(page.description, /不是投資建議/);
assert.match(page.h1, /美股 ADR 是什麼/);

const html = renderGuideDocument(page);
assert.match(
  html,
  /<title>美股 ADR 是什麼？台灣投資人怎麼理解｜Stocktools<\/title>/,
);
assert.match(
  html,
  /<h1>美股 ADR 是什麼？先搞懂存託憑證，再談下單<\/h1>/,
);
assert.match(html, /<html lang="zh-Hant">/);
assert.match(html, /不是投資建議/);
assert.match(html, /FAQPage/);
assert.match(html, /href="\/tw\/us-first-buy"/);
assert.match(html, /href="\/tw\/us-etf"/);
assert.match(html, /href="\/tw\/us-open-account"/);
assert.match(html, /href="\/tw\/us-order-types"/);
assert.match(html, /href="\/tw\/us-fee-calculator"/);
assert.match(html, /href="\/tw\/us-deposit"/);
assert.match(html, /href="\/tw\/us-tax"/);
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
assert.doesNotMatch(html, /TSM|BABA|NIO|ASML/);

for (const phrase of [
  '美國存託憑證',
  '存託銀行',
  '非美國公司',
  '普通股',
  'ETF',
  'Sponsored',
  'unsponsored',
  'W-8BEN',
  '美元',
]) {
  assert.match(html, new RegExp(phrase));
}

assert.match(html, /保管|存託服務費/);
assert.match(html, /不是推薦代號|不寫任何代號/);

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
assert.ok(
  vercel.rewrites.some(
    (entry) =>
      entry.source === '/tw/us-adr' &&
      entry.destination === '/tw/us-adr/index.html',
  ),
);
const catchAllIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/:path*',
);
const adrIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/us-adr',
);
assert.ok(adrIndex >= 0 && adrIndex < catchAllIndex);
assert.ok(
  vercel.redirects.some(
    (entry) =>
      entry.source === '/tw/adr' &&
      entry.destination === '/tw/us-adr' &&
      entry.permanent === true,
  ),
);

const publicSitemap = readFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  'utf8',
);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-adr/);

console.log(
  'US ADR guide passed: unique TW title, depositary explainer, no tickers, FAQ, Firstrade CTA, rewrite before SPA catch-all.',
);
