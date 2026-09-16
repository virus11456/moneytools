import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { SEO_GUIDES, SITE_ORIGIN } from '../app/seoGuides.ts';

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function noscript(guide) {
  const sections = guide.sections
    .map((section) => {
      const items = section.items
        ? `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : '';
      return `<section><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join('')}${items}</section>`;
    })
    .join('');
  return `<noscript><article><h1>${escapeHtml(guide.h1)}</h1><p>${escapeHtml(
    guide.lede,
  )}</p>${sections}<p>券商／開戶導購 placeholder：開戶連結尚未啟用。</p></article></noscript>`;
}

export async function writeSeoHtml(indexHtml, distUrl) {
  const titles = new Set();
  const descriptions = new Set();
  for (const guide of SEO_GUIDES) {
    if (titles.has(guide.title) || descriptions.has(guide.description)) {
      throw new Error(`SEO guide metadata must be unique: ${guide.path}`);
    }
    titles.add(guide.title);
    descriptions.add(guide.description);
    let html = indexHtml
      .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(guide.title)}</title>`)
      .replace(
        /<meta name="description" content="[^"]*"/,
        `<meta name="description" content="${escapeHtml(guide.description)}"`,
      );
    if (!html.includes('rel="canonical"')) {
      html = html.replace(
        '</head>',
        `<link rel="canonical" href="${SITE_ORIGIN}${guide.path}"/>
<meta property="og:title" content="${escapeHtml(guide.title)}"/>
<meta property="og:description" content="${escapeHtml(guide.description)}"/>
</head>`,
      );
    }
    if (!html.includes('<noscript>')) {
      html = html.replace('</body>', `${noscript(guide)}</body>`);
    }
    const dir = new URL(`.${guide.path}/`, distUrl);
    await mkdir(dir, { recursive: true });
    await writeFile(new URL('index.html', dir), html);
    await writeFile(new URL(`.${guide.path}.html`, distUrl), html);
  }
}

if (import.meta.main) {
  const dist = new URL('../dist/', import.meta.url);
  const indexHtml = await readFile(new URL('index.html', dist), 'utf8');
  await writeSeoHtml(indexHtml, dist);
}
