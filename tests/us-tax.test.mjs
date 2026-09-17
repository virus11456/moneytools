import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDE_PAGES } from '../app/guides/pages.ts';
import { renderGuideDocument } from '../app/guides/document.ts';
import { FIRSTRADE_OPEN_URL } from '../app/affiliate.ts';

const REFERRAL =
  'https://www.firstrade.com/accounts/referral?im_ref=bIQJ59ginr1r';

const page = GUIDE_PAGES.find((item) => item.slug === 'us-tax');
assert.ok(page);
assert.equal(page.path, '/tw/us-tax');
assert.equal(
  page.title,
  'W-8BEN 與美股預扣稅：台灣投資人概覽｜Stocktools',
);
assert.notEqual(page.title, 'Stocktools｜美股雙重分析');
assert.match(page.description, /不是稅務建議/);
assert.match(page.h1, /W-8BEN/);

const html = renderGuideDocument(page);
assert.match(
  html,
  /<title>W-8BEN 與美股預扣稅：台灣投資人概覽｜Stocktools<\/title>/,
);
assert.match(html, /<h1>開好美股帳戶後，為什麼還要填 W-8BEN？<\/h1>/);
assert.match(html, /<html lang="zh-Hant">/);
assert.match(html, /不是稅務建議/);
assert.match(html, /示意／常見結構/);
assert.match(html, /財政部/);
assert.match(html, /FAQPage/);
assert.match(html, /href="\/tw\/us-broker"/);
assert.match(html, /href="\/tw\/us-deposit"/);
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
assert.doesNotMatch(html, /保證報酬/);
assert.doesNotMatch(html, /穩賺/);

for (const phrase of [
  '不填 W-8BEN',
  '有效期',
  'TIN',
  '股息稅',
  '資本利得',
  '台灣就不用報',
]) {
  assert.match(html, new RegExp(phrase));
}

assert.match(html, /30%/);
assert.match(html, /15%/);
assert.match(html, /不要假設一定從 30% 降到 15%/);

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
assert.ok(
  vercel.rewrites.some(
    (entry) =>
      entry.source === '/tw/us-tax' &&
      entry.destination === '/tw/us-tax/index.html',
  ),
);
const catchAllIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/:path*',
);
const taxIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/us-tax',
);
assert.ok(taxIndex >= 0 && taxIndex < catchAllIndex);
assert.ok(
  vercel.redirects.some(
    (entry) =>
      entry.source === '/tw/w-8ben' &&
      entry.destination === '/tw/us-tax' &&
      entry.permanent === true,
  ),
);

const publicSitemap = readFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  'utf8',
);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-tax/);

console.log(
  'US tax guide passed: unique TW title, W-8BEN overview, conservative rates, FAQ, Firstrade CTA, rewrite before SPA catch-all.',
);
