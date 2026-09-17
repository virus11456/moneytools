import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  GUIDE_PAGES,
  RISK_DISCLAIMER,
  affiliateUrl,
  isGuidePath,
} from '../app/guides/pages.ts';
import {
  renderGuideDocument,
  sitemapXml,
  robotsTxt,
} from '../app/guides/document.ts';
import { FIRSTRADE_OPEN_URL } from '../app/affiliate.ts';

const REFERRAL =
  'https://www.firstrade.com/accounts/referral?im_ref=bIQJ59ginr1r';

assert.equal(GUIDE_PAGES.length, 10);
assert.deepEqual(
  GUIDE_PAGES.map((page) => page.path),
  [
    '/tw/us-market-hours',
    '/tw/us-broker',
    '/tw/us-fees',
    '/tw/us-fee-calculator',
    '/tw/us-watchlist',
    '/tw/us-account',
    '/tw/watchlist-guide',
    '/tw/risk-plan',
    '/tw/us-vs-tw',
    '/tw/faq',
  ],
);

assert.equal(isGuidePath('/tw/faq'), true);
assert.equal(isGuidePath('/tw/faq/'), true);
assert.equal(isGuidePath('/tw/us-broker'), true);
assert.equal(isGuidePath('/tw/us-watchlist/'), true);
assert.equal(isGuidePath('/tw/us-fees'), true);
assert.equal(isGuidePath('/tw/us-fee-calculator'), true);
assert.equal(isGuidePath('/tw/us-fee-calculator/'), true);
assert.equal(isGuidePath('/tw/us-market-hours'), true);
assert.equal(isGuidePath('/tw/us-market-hours/'), true);
assert.equal(isGuidePath('/tw/stock/2330'), false);
assert.equal(isGuidePath('/tw'), false);

const titles = new Set(GUIDE_PAGES.map((page) => page.title));
const descriptions = new Set(GUIDE_PAGES.map((page) => page.description));
const headings = new Set(GUIDE_PAGES.map((page) => page.h1));
assert.equal(titles.size, GUIDE_PAGES.length);
assert.equal(descriptions.size, GUIDE_PAGES.length);
assert.equal(headings.size, GUIDE_PAGES.length);
for (const page of GUIDE_PAGES) {
  assert.notEqual(page.title, 'Stocktools｜美股雙重分析');
}

delete process.env.NEXT_PUBLIC_AFFILIATE_URL;
delete process.env.VITE_AFFILIATE_URL;
assert.equal(FIRSTRADE_OPEN_URL, REFERRAL);
assert.equal(affiliateUrl(), REFERRAL);

const forbidden = [
  '穩賺',
  '必賺',
  '保證報酬',
  'interactivebrokers',
  'ibkr.com',
  'tastytrade',
  'binance',
  'coinbase',
  'partnerId=',
  'aff_id=',
];

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
for (const page of GUIDE_PAGES) {
  const rewrite = vercel.rewrites.find(
    (entry) =>
      entry.source === page.path &&
      entry.destination === `${page.path}/index.html`,
  );
  assert.ok(rewrite, `vercel.json missing rewrite for ${page.path}`);
}

for (const page of GUIDE_PAGES) {
  const html = renderGuideDocument(page, { stylesheets: ['/assets/app.css'] });
  assert.match(html, /<html lang="zh-Hant">/);
  assert.match(
    html,
    new RegExp(
      `<title>${page.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</title>`,
    ),
  );
  assert.match(
    html,
    new RegExp(
      `<meta name="description" content="${page.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`,
    ),
  );
  assert.match(
    html,
    new RegExp(`<h1>${page.h1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`),
  );
  assert.match(html, /<link rel="canonical"/);
  assert.match(html, /https:\/\/stocktools\.cc/);
  assert.match(html, /Stocktools/);
  assert.doesNotMatch(html, /Moneytools/);
  assert.match(html, /og:site_name" content="Stocktools"/);
  assert.match(html, /warhubs\.com/);
  assert.match(html, /hypeboss\.cc/);
  assert.match(html, /toolist\.cc/);
  assert.match(html, /simples\.com\.tw/);
  assert.match(html, /href="\/"/);
  assert.match(html, /href="\/tw"/);
  assert.match(html, /href="\/tw\/us-broker"/);
  assert.match(html, /href="\/tw\/us-market-hours"/);
  assert.match(html, /href="\/tw\/us-fees"/);
  assert.match(html, /href="\/tw\/us-fee-calculator"/);
  assert.match(html, /href="\/tw\/us-watchlist"/);
  assert.match(html, /href="\/tw\/us-account"/);
  assert.match(html, /href="\/tw\/watchlist-guide"/);
  assert.match(html, /href="\/tw\/risk-plan"/);
  assert.ok(html.includes(RISK_DISCLAIMER));
  assert.match(html, /開美股帳戶/);
  assert.match(
    html,
    /href="https:\/\/www\.firstrade\.com\/accounts\/referral\?im_ref=bIQJ59ginr1r"/,
  );
  assert.match(html, /rel="nofollow sponsored noopener noreferrer"/);
  assert.doesNotMatch(html, /id="root"/);
  for (const phrase of forbidden) {
    assert.equal(
      html.toLowerCase().includes(phrase.toLowerCase()),
      false,
      `${page.path} contains ${phrase}`,
    );
  }
}

process.env.NEXT_PUBLIC_AFFILIATE_URL = 'https://example.com/open-account';
const withCta = renderGuideDocument(GUIDE_PAGES[0]);
assert.match(withCta, /開美股帳戶/);
assert.match(
  withCta,
  /class="guide-cta-button" href="https:\/\/example.com\/open-account"/,
);
assert.match(withCta, /rel="nofollow sponsored noopener noreferrer"/);
assert.doesNotMatch(withCta, /example.com\/open-account\?/);
delete process.env.NEXT_PUBLIC_AFFILIATE_URL;

const faq = renderGuideDocument(
  GUIDE_PAGES.find((page) => page.slug === 'faq'),
);
assert.match(faq, /application\/ld\+json/);
assert.match(faq, /FAQPage/);

const sitemap = sitemapXml();
for (const page of GUIDE_PAGES) {
  assert.match(sitemap, new RegExp(`https://stocktools\\.cc${page.path}`));
}
assert.match(sitemap, /stocktools\.cc\/tw</);
assert.doesNotMatch(sitemap, /vercel\.app/);
assert.match(robotsTxt(), /Sitemap: https:\/\/stocktools\.cc\/sitemap\.xml/);

const publicSitemap = readFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  'utf8',
);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-broker/);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-market-hours/);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-fees/);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-fee-calculator/);
assert.match(publicSitemap, /https:\/\/stocktools\.cc\/tw\/us-watchlist/);

const distPage = new URL('../dist/tw/us-broker/index.html', import.meta.url);
if (existsSync(distPage)) {
  for (const page of GUIDE_PAGES) {
    const file = new URL(`../dist${page.path}/index.html`, import.meta.url);
    const html = readFileSync(file, 'utf8');
    assert.match(html, /<h1>/);
    assert.match(html, /<title>/);
    assert.match(html, /<meta name="description"/);
    assert.match(html, /<link rel="stylesheet"/);
    assert.match(html, /開美股帳戶/);
    assert.match(
      html,
      /firstrade\.com\/accounts\/referral\?im_ref=bIQJ59ginr1r/,
    );
    assert.ok(html.includes(page.h1));
    assert.ok(html.includes(page.title));
  }
  const builtSitemap = readFileSync(
    new URL('../dist/sitemap.xml', import.meta.url),
    'utf8',
  );
  assert.match(builtSitemap, /\/tw\/us-broker/);
  assert.match(builtSitemap, /\/tw\/us-market-hours/);
  assert.match(builtSitemap, /\/tw\/us-fees/);
  assert.match(builtSitemap, /\/tw\/us-fee-calculator/);
  assert.match(builtSitemap, /\/tw\/us-watchlist/);
  assert.match(builtSitemap, /stocktools\.cc/);
  const builtRobots = readFileSync(
    new URL('../dist/robots.txt', import.meta.url),
    'utf8',
  );
  assert.match(builtRobots, /Sitemap: https:\/\/stocktools\.cc\/sitemap\.xml/);
  const hoursHtml = readFileSync(
    new URL('../dist/tw/us-market-hours/index.html', import.meta.url),
    'utf8',
  );
  assert.match(hoursHtml, /id="us-market-now"/);
  assert.match(hoursHtml, /<script type="module" src="\/assets\/[^"]*us-market-hours/);
  const feeHtml = readFileSync(
    new URL('../dist/tw/us-fee-calculator/index.html', import.meta.url),
    'utf8',
  );
  assert.match(feeHtml, /id="us-fee-calc"/);
  assert.match(feeHtml, /<script type="module" src="\/assets\/[^"]*us-fee-calculator/);
}

console.log(
  'SEO guide pages: unique TW titles, crawlable HTML, Firstrade CTA, sitemap.',
);
