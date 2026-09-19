import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDE_PAGES } from '../app/guides/pages.ts';
import { renderGuideDocument } from '../app/guides/document.ts';
import { FIRSTRADE_OPEN_URL } from '../app/affiliate.ts';

const REFERRAL =
  'https://www.firstrade.com/accounts/referral?im_ref=bIQJ59ginr1r';

const page = GUIDE_PAGES.find((item) => item.slug === 'us-fx');
assert.ok(page);
assert.equal(page.path, '/tw/us-fx');
assert.equal(
  page.title,
  '美股匯損與匯率價差：台幣換成美元要注意什麼｜Stocktools',
);
assert.notEqual(page.title, 'Stocktools｜美股雙重分析');
assert.match(page.description, /不是投資建議/);
assert.match(page.h1, /匯損/);

const html = renderGuideDocument(page);
assert.match(
  html,
  /<title>美股匯損與匯率價差：台幣換成美元要注意什麼｜Stocktools<\/title>/,
);
assert.match(
  html,
  /<h1>買美股會有匯損嗎？先分清匯率價差與持有期間的匯率<\/h1>/,
);
assert.match(html, /<html lang="zh-Hant">/);
assert.match(html, /不是投資建議/);
assert.match(html, /FAQPage/);
assert.match(html, /href="\/tw\/us-deposit"/);
assert.match(html, /href="\/tw\/us-fee-calculator"/);
assert.match(html, /href="\/tw\/us-fees"/);
assert.match(html, /href="\/tw\/us-first-buy"/);
assert.match(html, /href="\/tw\/us-open-account"/);
assert.match(html, /href="\/tw\/us-etf"/);
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

for (const phrase of [
  '匯損',
  '匯率價差',
  '電匯',
  '複委託',
  '海外',
  '股票',
  '台幣',
  '美元',
]) {
  assert.match(html, new RegExp(phrase));
}

assert.match(html, /兩層|不是同一件事/);
assert.doesNotMatch(html, /bp\b|基點/);
assert.doesNotMatch(html, /保證匯率|保證匯差|固定匯差 \d/);

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
assert.ok(
  vercel.rewrites.some(
    (entry) =>
      entry.source === '/tw/us-fx' &&
      entry.destination === '/tw/us-fx/index.html',
  ),
);
const catchAllIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/:path*',
);
const fxIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/us-fx',
);
assert.ok(fxIndex >= 0 && fxIndex < catchAllIndex);
assert.ok(
  vercel.redirects.some(
    (entry) =>
      entry.source === '/tw/fx' &&
      entry.destination === '/tw/us-fx' &&
      entry.permanent === true,
  ),
);

const publicSitemap = readFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  'utf8',
);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-fx/);

console.log(
  'US FX guide passed: unique TW title, conversion vs holding-period FX, dual path, FAQ, Firstrade CTA, rewrite before SPA catch-all.',
);
