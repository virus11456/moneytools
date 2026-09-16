import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SEO_GUIDES, guideByPath, normalizePathname } from '../app/seoGuides.ts';
import { positionSize } from '../app/positionSize.ts';
import { writeSeoHtml } from '../scripts/seo-html.mjs';

assert.equal(SEO_GUIDES.length, 5);
const titles = SEO_GUIDES.map((guide) => guide.title);
const descriptions = SEO_GUIDES.map((guide) => guide.description);
assert.equal(new Set(titles).size, titles.length);
assert.equal(new Set(descriptions).size, descriptions.length);
const banned = /勝率|獲利保證|穩賺|回測績效|推薦買入/;
for (const guide of SEO_GUIDES) {
  assert.match(guide.path, /^\/tw\//);
  assert.match(guide.title, /Moneytools/);
  assert.ok(guide.description.length >= 40);
  assert.doesNotMatch(`${guide.title}${guide.description}${guide.lede}`, banned);
  for (const section of guide.sections) {
    assert.doesNotMatch(section.heading + section.paragraphs.join(''), banned);
  }
}
assert.equal(guideByPath('/tw/us-watchlist/').path, '/tw/us-watchlist');
assert.equal(normalizePathname('/tw/'), '/tw');
assert.equal(
  positionSize({ equity: 10000, riskPercent: 1, entry: 100, invalidation: 95 }).shares,
  20,
);
assert.equal(
  positionSize({ equity: 10000, riskPercent: 1, entry: 100, invalidation: 100 }).ok,
  false,
);
assert.equal(
  positionSize({ equity: 50, riskPercent: 1, entry: 100, invalidation: 90 }).ok,
  false,
);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'moneytools-seo-'));
const index = `<!doctype html><html lang="zh-Hant"><head><meta charset="UTF-8"/><meta name="description" content="預設"/><title>預設</title></head><body><div id="root"></div></body></html>`;
await writeSeoHtml(index, new URL(`file://${tmp}/`));
for (const guide of SEO_GUIDES) {
  const html = fs.readFileSync(path.join(tmp, guide.path.slice(1), 'index.html'), 'utf8');
  assert.match(html, new RegExp(`<title>${guide.title}</title>`));
  assert.match(html, new RegExp(`content="${guide.description}"`));
  assert.match(html, new RegExp(`<h1>${guide.h1}</h1>`));
  assert.match(html, /券商／開戶導購 placeholder/);
  const flat = fs.readFileSync(path.join(tmp, `${guide.path.slice(1)}.html`), 'utf8');
  assert.match(flat, new RegExp(`<title>${guide.title}</title>`));
}
console.log('SEO guides: unique metadata, placeholder CTA, position-size math, crawlable HTML.');
