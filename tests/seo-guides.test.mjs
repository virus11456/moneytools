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

assert.equal(GUIDE_PAGES.length, 5);
assert.deepEqual(
  GUIDE_PAGES.map((page) => page.path),
  [
    '/tw/us-account',
    '/tw/watchlist-guide',
    '/tw/risk-plan',
    '/tw/us-vs-tw',
    '/tw/faq',
  ],
);

assert.equal(isGuidePath('/tw/faq'), true);
assert.equal(isGuidePath('/tw/faq/'), true);
assert.equal(isGuidePath('/tw/stock/2330'), false);
assert.equal(isGuidePath('/tw'), false);

const titles = new Set(GUIDE_PAGES.map((page) => page.title));
const descriptions = new Set(GUIDE_PAGES.map((page) => page.description));
assert.equal(titles.size, GUIDE_PAGES.length);
assert.equal(descriptions.size, GUIDE_PAGES.length);

delete process.env.NEXT_PUBLIC_AFFILIATE_URL;
delete process.env.VITE_AFFILIATE_URL;
assert.equal(affiliateUrl(), '');

const forbidden = [
  '穩賺',
  '必賺',
  '保證報酬',
  'firstrade',
  'interactivebrokers',
  'ibkr.com',
  'tastytrade',
  'partnerId=',
  'aff_id=',
];

for (const page of GUIDE_PAGES) {
  const html = renderGuideDocument(page, { stylesheets: ['/assets/app.css'] });
  assert.match(html, /<html lang="zh-Hant">/);
  assert.match(
    html,
    new RegExp(
      `<title>${page.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</title>`,
    ),
  );
  assert.match(html, /<meta name="description"/);
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
  assert.match(html, /href="\/tw\/us-account"/);
  assert.match(html, /href="\/tw\/watchlist-guide"/);
  assert.match(html, /href="\/tw\/risk-plan"/);
  assert.ok(html.includes(RISK_DISCLAIMER));
  assert.doesNotMatch(html, /開立券商／複委託帳戶/);
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
assert.match(withCta, /開立券商／複委託帳戶/);
assert.match(withCta, /href="https:\/\/example.com\/open-account"/);
assert.match(withCta, /rel="nofollow sponsored noopener noreferrer"/);
assert.doesNotMatch(withCta, /example.com\/open-account\?/);
delete process.env.NEXT_PUBLIC_AFFILIATE_URL;

const faq = renderGuideDocument(
  GUIDE_PAGES.find((page) => page.slug === 'faq'),
);
assert.match(faq, /application\/ld\+json/);
assert.match(faq, /FAQPage/);

const sitemap = sitemapXml();
for (const page of GUIDE_PAGES) assert.match(sitemap, new RegExp(page.path));
assert.match(sitemap, /stocktools\.cc\/tw</);
assert.match(
  robotsTxt(),
  /Sitemap: https:\/\/stocktools\.cc\/sitemap\.xml/,
);

const distPage = new URL('../dist/tw/us-account/index.html', import.meta.url);
if (existsSync(distPage)) {
  for (const page of GUIDE_PAGES) {
    const file = new URL(`../dist${page.path}/index.html`, import.meta.url);
    const html = readFileSync(file, 'utf8');
    assert.match(html, /<h1>/);
    assert.match(html, /<title>/);
    assert.match(html, /<meta name="description"/);
    assert.match(html, /<link rel="stylesheet"/);
    assert.doesNotMatch(html, /開立券商／複委託帳戶/);
    assert.ok(html.includes(page.h1));
  }
  const builtSitemap = readFileSync(
    new URL('../dist/sitemap.xml', import.meta.url),
    'utf8',
  );
  assert.match(builtSitemap, /\/tw\/faq/);
  const builtRobots = readFileSync(
    new URL('../dist/robots.txt', import.meta.url),
    'utf8',
  );
  assert.match(builtRobots, /sitemap\.xml/);
}

console.log(
  'SEO guide pages: Traditional Chinese HTML, disclaimers, sibling nav, hidden CTA, sitemap.',
);
