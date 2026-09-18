import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { SIBLING_TOOLS, SIMPLES_SITE, siblingNavHtml } from '../app/siblingTools.ts';
import { GUIDE_PAGES } from '../app/guides/pages.ts';
import { renderGuideDocument } from '../app/guides/document.ts';

const INDEX = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.equal(SIBLING_TOOLS.length, 3);
assert.deepEqual(
  SIBLING_TOOLS.map((tool) => tool.href),
  ['https://warhubs.com/', 'https://hypeboss.cc/', 'https://toolist.cc/'],
);
assert.equal(SIBLING_TOOLS[0].label, 'Warhubs');
assert.equal(SIBLING_TOOLS[0].hint, '戰情觀測');
assert.equal(SIBLING_TOOLS[1].label, 'HypeBoss');
assert.equal(SIBLING_TOOLS[1].hint, '加密工具');
assert.equal(SIBLING_TOOLS[2].label, 'Toolist');
assert.equal(SIBLING_TOOLS[2].hint, '工具捷徑');
assert.equal(SIMPLES_SITE.href, 'https://simples.com.tw/');
assert.equal(SIMPLES_SITE.label, 'SIMPLES 工具網');

for (const source of [INDEX, siblingNavHtml('footer')]) {
  assert.match(source, /https:\/\/warhubs\.com\//);
  assert.match(source, /https:\/\/hypeboss\.cc\//);
  assert.match(source, /https:\/\/toolist\.cc\//);
  assert.match(source, /https:\/\/simples\.com\.tw\//);
  assert.doesNotMatch(source, /firstrade|okx|pionex|luxstay|rimtown|polyboy/i);
}

assert.match(INDEX, /sibling-nav-static/);
assert.match(siblingNavHtml(), /aria-label="相關工具"/);
assert.match(siblingNavHtml('footer'), /aria-label="SIMPLES 工具網"/);
assert.match(siblingNavHtml('footer'), /sibling-nav-footer/);

const guide = renderGuideDocument(GUIDE_PAGES[0]);
assert.match(guide, /class="sibling-nav"/);
assert.match(guide, /class="sibling-nav sibling-nav-footer"/);
assert.match(guide, /Warhubs<small>戰情觀測<\/small>/);
assert.match(guide, /HypeBoss<small>加密工具<\/small>/);
assert.match(guide, /Toolist<small>工具捷徑<\/small>/);
assert.match(guide, /SIMPLES 工具網/);
assert.doesNotMatch(guide, /luxstay|rimtown|polyboy/i);

const distIndex = new URL('../dist/index.html', import.meta.url);
if (existsSync(distIndex)) {
  const html = readFileSync(distIndex, 'utf8');
  assert.match(html, /https:\/\/warhubs\.com\//);
  assert.match(html, /https:\/\/hypeboss\.cc\//);
  assert.match(html, /https:\/\/toolist\.cc\//);
}

console.log('Sibling nav: crawlable homepage + guide footer backlinks.');
