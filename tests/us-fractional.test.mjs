import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDE_PAGES } from '../app/guides/pages.ts';
import { renderGuideDocument } from '../app/guides/document.ts';
import { FIRSTRADE_OPEN_URL } from '../app/affiliate.ts';

const REFERRAL =
  'https://www.firstrade.com/accounts/referral?im_ref=bIQJ59ginr1r';

const page = GUIDE_PAGES.find((item) => item.slug === 'us-fractional');
assert.ok(page);
assert.equal(page.path, '/tw/us-fractional');
assert.equal(
  page.title,
  '美股碎股是什麼？台灣投資人怎麼理解｜Stocktools',
);
assert.notEqual(page.title, 'Stocktools｜美股雙重分析');
assert.match(page.description, /不是投資建議/);
assert.match(page.h1, /美股碎股是什麼/);

const html = renderGuideDocument(page);
assert.match(
  html,
  /<title>美股碎股是什麼？台灣投資人怎麼理解｜Stocktools<\/title>/,
);
assert.match(
  html,
  /<h1>美股碎股是什麼？先搞懂零股，再談下單<\/h1>/,
);
assert.match(html, /<html lang="zh-Hant">/);
assert.match(html, /不是投資建議/);
assert.match(html, /FAQPage/);
assert.match(html, /href="\/tw\/us-first-buy"/);
assert.match(html, /href="\/tw\/us-open-account"/);
assert.match(html, /href="\/tw\/us-order-types"/);
assert.match(html, /href="\/tw\/us-etf"/);
assert.match(html, /href="\/tw\/us-fee-calculator"/);
assert.match(html, /href="\/tw\/us-deposit"/);
assert.match(html, /href="\/tw\/us-fx"/);
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
assert.doesNotMatch(html, /BRK|AMZN|GOOGL|TSLA|NVDA|AAPL/);

for (const phrase of [
  '碎股',
  'fractional',
  '整股',
  '複委託',
  '海外',
  '配息',
  '投票',
  '委託',
  '小資金',
]) {
  assert.match(html, new RegExp(phrase));
}

assert.match(html, /不是所有券商|支援不一/);
assert.match(html, /不保證該帳戶支援碎股|不保證.*碎股/);
assert.match(html, /不是推薦|不寫任何代號/);

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
assert.ok(
  vercel.rewrites.some(
    (entry) =>
      entry.source === '/tw/us-fractional' &&
      entry.destination === '/tw/us-fractional/index.html',
  ),
);
const catchAllIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/:path*',
);
const fractionalIndex = vercel.rewrites.findIndex(
  (entry) => entry.source === '/tw/us-fractional',
);
assert.ok(fractionalIndex >= 0 && fractionalIndex < catchAllIndex);
assert.ok(
  vercel.redirects.some(
    (entry) =>
      entry.source === '/tw/fractional' &&
      entry.destination === '/tw/us-fractional' &&
      entry.permanent === true,
  ),
);

const publicSitemap = readFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  'utf8',
);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-fractional/);

console.log(
  'US fractional guide passed: unique TW title, no tickers, FAQ, soft Firstrade CTA, rewrite before SPA catch-all.',
);
