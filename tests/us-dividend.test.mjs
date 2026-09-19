import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDE_PAGES } from '../app/guides/pages.ts';
import { renderGuideDocument } from '../app/guides/document.ts';
import { FIRSTRADE_OPEN_URL } from '../app/affiliate.ts';

const REFERRAL =
  'https://www.firstrade.com/accounts/referral?im_ref=bIQJ59ginr1r';

const page = GUIDE_PAGES.find((item) => item.slug === 'us-dividend');
assert.ok(page);
assert.equal(page.path, '/tw/us-dividend');
assert.equal(
  page.title,
  '美股除息日與配息：台灣投資人怎麼領｜Stocktools',
);
assert.notEqual(page.title, 'Stocktools｜美股雙重分析');
assert.match(page.description, /不是投資建議/);
assert.match(page.h1, /除息日/);

const html = renderGuideDocument(page);
assert.match(
  html,
  /<title>美股除息日與配息：台灣投資人怎麼領｜Stocktools<\/title>/,
);
assert.match(
  html,
  /<h1>美股配息怎麼領？先搞懂除息日，再看入帳路徑<\/h1>/,
);
assert.match(html, /<html lang="zh-Hant">/);
assert.match(html, /不是投資建議/);
assert.match(html, /FAQPage/);
assert.match(html, /href="\/tw\/us-open-account"/);
assert.match(html, /href="\/tw\/us-etf"/);
assert.match(html, /href="\/tw\/us-tax"/);
assert.match(html, /href="\/tw\/us-deposit"/);
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
assert.doesNotMatch(html, /必賺/);
assert.doesNotMatch(html, /推薦買/);
assert.doesNotMatch(html, /殖利率 \d/);

for (const phrase of [
  '除息日',
  '股權登記日',
  '發放日',
  '複委託',
  '海外',
  'W-8BEN',
  '預扣',
  '匯率',
  '財政部',
]) {
  assert.match(html, new RegExp(phrase));
}

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
assert.ok(
  vercel.rewrites.some(
    (entry) =>
      entry.source === '/tw/us-dividend' &&
      entry.destination === '/tw/us-dividend/index.html',
  ),
);
const catchAllIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/:path*',
);
const dividendIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/us-dividend',
);
assert.ok(dividendIndex >= 0 && dividendIndex < catchAllIndex);
assert.ok(
  vercel.redirects.some(
    (entry) =>
      entry.source === '/tw/dividend' &&
      entry.destination === '/tw/us-dividend' &&
      entry.permanent === true,
  ),
);

const publicSitemap = readFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  'utf8',
);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-dividend/);

console.log(
  'US dividend guide passed: unique TW title, ex-date explainer, dual-path receive, FAQ, Firstrade CTA, rewrite before SPA catch-all.',
);
