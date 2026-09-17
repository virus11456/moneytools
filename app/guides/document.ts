import { SIBLING_TOOLS } from '../siblingTools.ts';
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

function siblingNav() {
  const links = SIBLING_TOOLS.map(
    (tool) =>
      `<a href="${tool.href}" target="_blank" rel="noreferrer">${tool.label}<small>${tool.hint}</small></a>`,
  ).join('\n      ');
  return `<nav class="sibling-nav" aria-label="相關工具">
      ${links}
    </nav>`;
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
  return `<aside class="guide-cta" aria-label="外部開戶連結">
    <p>以下為網站設定的外部開戶連結，不是 Stocktools 對特定券商的推薦，也不保證開戶條件或後續報酬。</p>
    <a class="guide-cta-button" href="${safe}" target="_blank" rel="nofollow sponsored noopener noreferrer">開立券商／複委託帳戶</a>
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
      ${siblingNav()}
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
        <a class="simples-fingerprint" href="https://simples.com.tw/" target="_blank" rel="noreferrer" aria-label="SIMPLES 簡單行銷">SIMPLES</a>
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
