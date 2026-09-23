import { siblingNavHtml } from '../siblingTools.ts';
import { TW_HUB } from './hub.ts';
import {
  affiliateUrl,
  GUIDE_PAGES,
  RISK_DISCLAIMER,
  siteOrigin,
  type GuidePageDef,
} from './pages.ts';

const ACTIVITY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>`;

export type GuideAssets = { stylesheets?: string[]; scripts?: string[] };

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function guideLinksHtml(currentPath?: string) {
  return `<nav class="guide-links" aria-label="說明頁">${GUIDE_PAGES.map(
    (page) =>
      `<a href="${page.path}"${page.path === currentPath ? ' aria-current="page"' : ''}>${page.navLabel}</a>`,
  ).join('')}</nav>`;
}

function affiliateCta() {
  const url = affiliateUrl();
  if (!url) return '';
  const safe = esc(url);
  let headline = '外部開戶連結';
  try {
    if (new URL(url).hostname.toLowerCase().includes('firstrade')) {
      headline = 'Firstrade · 中文介面 · 0 手續費美股';
    }
  } catch {
    /* keep generic headline if the URL cannot be parsed */
  }
  return `<aside class="guide-cta" id="open-account" aria-label="開美股帳戶">
    <p>${esc(headline)}</p>
    <p>可能為聯盟連結，我們可能因此獲得報酬。此連結不改變分析結果，也不是對特定券商的評分或獲利保證。</p>
    <a class="guide-cta-button" href="${safe}" target="_blank" rel="nofollow sponsored noopener noreferrer">開美股帳戶</a>
  </aside>`;
}

function faqBlock(page: GuidePageDef) {
  if (!page.faqs?.length) return '';
  const items = page.faqs
    .map(
      (item, i) => `<details class="guide-faq"${i === 0 ? ' open' : ''}>
        <summary>${esc(item.q)}</summary>
        <p>${esc(item.a)}</p>
      </details>`,
    )
    .join('');
  return `<section class="guide-section" id="questions"><h2>問題與回答</h2>${items}</section>`;
}

function jsonLd(page: GuidePageDef) {
  const webpage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    inLanguage: 'zh-Hant',
    url: `${siteOrigin()}${page.path}`,
    isPartOf: { '@type': 'WebSite', name: 'Stocktools', url: siteOrigin() },
  };
  const nodes: object[] = [webpage];
  if (page.faqs?.length) {
    nodes.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }
  return nodes
    .map(
      (node) =>
        `<script type="application/ld+json">${JSON.stringify(node)}</script>`,
    )
    .join('');
}

export function renderGuideBody(page: GuidePageDef) {
  const sections = page.sections
    .map(
      (section) =>
        `<section class="guide-section" id="${section.id}"><h2>${section.title}</h2>${section.html}</section>`,
    )
    .join('');
  return `<div class="app guide-app">
  <header class="header">
    <div class="header-lead">
      <a class="brand" href="/">
        <span class="brand-icon">${ACTIVITY_ICON}</span>
        stocktools<span class="beta">說明</span>
      </a>
      <nav class="market-switch" aria-label="股票市場">
        <a href="/">美股</a>
        <a href="/tw">台股</a>
      </nav>
      ${siblingNavHtml()}
    </div>
  </header>
  <main>
    <div class="topline">
      <span><span class="eyebrow">${page.eyebrow}</span> <span class="divider">/</span> ${page.navLabel}</span>
      ${guideLinksHtml(page.path)}
    </div>
    <div class="guide-layout">
      <article class="guide-article">
        <h1>${page.h1}</h1>
        <p class="guide-lead">${page.lead}</p>
        ${sections}
        ${faqBlock(page)}
        <p class="guide-disclaimer">${RISK_DISCLAIMER}</p>
      </article>
      <aside class="guide-aside">
        <div class="guide-panel">
          <span class="eyebrow">接著使用工具</span>
          <p>規則通過只代表條件符合，不代表應該交易。</p>
          <a class="guide-tool" href="${page.toolHref}">${page.toolLabel}</a>
          <a class="guide-tool-secondary" href="/tw">台股每日篩選</a>
        </div>
        ${affiliateCta()}
        <div class="guide-panel">
          <span class="eyebrow">本站其他說明</span>
          ${guideLinksHtml(page.path)}
        </div>
      </aside>
    </div>
    <footer>
      <div>
        <strong>stocktools</strong>
        <p>規則透明，判斷留給你。</p>
        ${siblingNavHtml('footer')}
        ${guideLinksHtml(page.path)}
      </div>
      <p>${RISK_DISCLAIMER}</p>
      <a href="https://github.com/virus11456/moneytools" target="_blank" rel="noreferrer">查看規則原始碼 <span aria-hidden="true">↗</span></a>
    </footer>
  </main>
</div>`;
}

export function renderGuideDocument(
  page: GuidePageDef,
  assets: GuideAssets = {},
) {
  const canonical = `${siteOrigin()}${page.path}`;
  const styles = (assets.stylesheets || [])
    .map((href) => `<link rel="stylesheet" href="${esc(href)}">`)
    .join('');
  const scripts = (assets.scripts || [])
    .map((src) => `<script type="module" src="${esc(src)}"></script>`)
    .join('');
  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}"/>
<link rel="canonical" href="${esc(canonical)}"/>
<meta property="og:title" content="${esc(page.title)}"/>
<meta property="og:description" content="${esc(page.description)}"/>
<meta property="og:site_name" content="Stocktools"/>
<meta property="og:locale" content="zh_TW"/>
<meta property="og:type" content="article"/>
<meta property="og:url" content="${esc(canonical)}"/>
<link rel="icon" href="/favicon.svg"/>
${styles}
${jsonLd(page)}
</head>
<body>
${renderGuideBody(page)}
${scripts}
</body>
</html>
`;
}

export function sitemapXml() {
  const paths = ['/', '/tw', ...GUIDE_PAGES.map((page) => page.path)];
  const urls = paths
    .map(
      (path) => `  <url>
    <loc>${siteOrigin()}${path === '/' ? '/' : path}</loc>
    <changefreq>weekly</changefreq>
  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function robotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${siteOrigin()}/sitemap.xml
`;
}

export function twHubArticleHtml() {
  const items = GUIDE_PAGES.map(
    (page) =>
      `<li><a href="${page.path}">${esc(page.navLabel)}</a><span>${esc(page.description)}</span></li>`,
  ).join('');
  return `<article class="tw-crawl-hub" id="tw-hub">
  <p class="eyebrow">繁中說明</p>
  <h1>${esc(TW_HUB.h1)}</h1>
  <p class="guide-lead">${esc(TW_HUB.lead)}</p>
  <ul class="tw-crawl-directory">${items}</ul>
  <p><a href="/">美股雙重分析</a></p>
  ${affiliateCta()}
  <p class="guide-disclaimer">${esc(RISK_DISCLAIMER)}</p>
</article>`;
}

function replaceAttr(
  html: string,
  pattern: RegExp,
  content: string,
  label: string,
) {
  const next = html.replace(pattern, (_match, prefix: string, suffix: string) => {
    return `${prefix}${content}${suffix}`;
  });
  if (next === html) throw new Error(`moneytools seo: missing ${label}`);
  return next;
}

/** Distinct /tw document derived from the built SPA shell so the screener still hydrates. */
export function applyTwHubDocument(indexHtml: string) {
  const canonical = `${siteOrigin()}${TW_HUB.path}`;
  let html = indexHtml;
  html = replaceAttr(
    html,
    /(<title>)[^<]*(<\/title>)/,
    esc(TW_HUB.title),
    'title',
  );
  html = replaceAttr(
    html,
    /(<meta\s[^>]*name="description"[^>]*content=")[^"]*(")/,
    esc(TW_HUB.description),
    'description',
  );
  html = replaceAttr(
    html,
    /(<meta\s[^>]*property="og:title"[^>]*content=")[^"]*(")/,
    esc(TW_HUB.title),
    'og:title',
  );
  html = replaceAttr(
    html,
    /(<meta\s[^>]*property="og:description"[^>]*content=")[^"]*(")/,
    esc(TW_HUB.description),
    'og:description',
  );
  html = replaceAttr(
    html,
    /(<link\s[^>]*rel="canonical"[^>]*href=")[^"]*(")/,
    esc(canonical),
    'canonical',
  );
  html = replaceAttr(
    html,
    /(<meta\s[^>]*property="og:url"[^>]*content=")[^"]*(")/,
    esc(canonical),
    'og:url',
  );
  const withHub = html.replace(
    /<div id="root">\s*<\/div>/,
    `<div id="root">${twHubArticleHtml()}</div>`,
  );
  if (withHub === html) throw new Error('moneytools seo: missing #root');
  return withHub;
}
