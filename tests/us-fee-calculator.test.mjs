import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_FEE_INPUT,
  compareUsBrokerFees,
  feeCalculatorHtml,
  finiteNumber,
  formatMoney,
  parseFeeSide,
  shareCount,
} from '../app/usFeeCalculator.ts';

function closeTo(actual, expected, digits = 6) {
  assert.equal(Number(actual.toFixed(digits)), Number(expected.toFixed(digits)));
}

const roundTrip = compareUsBrokerFees(DEFAULT_FEE_INPUT);
assert.equal(shareCount(DEFAULT_FEE_INPUT), 100);
assert.equal(roundTrip.sides, 2);
assert.equal(roundTrip.dual.commissionUsd, 40);
assert.equal(roundTrip.dual.fxTwd, 3200);
assert.equal(roundTrip.dual.totalTwd, 4480);
closeTo(roundTrip.dual.pctOfNotional, 1.4);
assert.equal(roundTrip.us.commissionUsd, 0);
closeTo(roundTrip.us.extraUsd, 0.278);
assert.equal(roundTrip.us.wireTwd, 300);
assert.equal(roundTrip.us.fxTwd, 1920);
closeTo(roundTrip.us.totalTwd, 2228.896);
closeTo(roundTrip.deltaTwd, 2251.104);

const buy = compareUsBrokerFees({ ...DEFAULT_FEE_INPUT, side: 'buy' });
assert.equal(buy.sides, 1);
assert.equal(buy.dual.commissionUsd, 20);
assert.equal(buy.dual.totalTwd, 2240);
assert.equal(buy.us.extraUsd, 0);
assert.equal(buy.us.wireTwd, 300);
assert.equal(buy.us.fxTwd, 960);
assert.equal(buy.us.totalTwd, 1260);

const sell = compareUsBrokerFees({ ...DEFAULT_FEE_INPUT, side: 'sell' });
closeTo(sell.us.extraUsd, 0.278);
assert.equal(sell.us.wireTwd, 0);
assert.equal(sell.us.fxTwd, 960);

const aboveMin = compareUsBrokerFees({
  ...DEFAULT_FEE_INPUT,
  notionalUsd: 200000,
  sharePriceUsd: 100,
});
assert.equal(aboveMin.shares, 2000);
assert.equal(aboveMin.dual.commissionUsd, 80);

assert.equal(parseFeeSide('buy'), 'buy');
assert.equal(parseFeeSide('nope'), 'round-trip');
assert.equal(finiteNumber('12.5'), 12.5);
assert.equal(finiteNumber('x', 3), 3);
assert.equal(formatMoney(Number.NaN, 'TWD'), '—');
assert.ok(Number.isNaN(shareCount({ notionalUsd: 1000, sharePriceUsd: 0 })));

const { GUIDE_PAGES } = await import('../app/guides/pages.ts');
const { renderGuideDocument } = await import('../app/guides/document.ts');
const page = GUIDE_PAGES.find((item) => item.slug === 'us-fee-calculator');
assert.ok(page);
const html = renderGuideDocument(page);
assert.match(html, /<title>美股複委託 vs 海外券商費用試算｜Stocktools<\/title>/);
assert.match(html, /<h1>複委託跟海外券商，來回成本差多少？<\/h1>/);
assert.match(html, /id="us-fee-calc"/);
assert.match(html, /示意／非報價/);
assert.match(html, /href="\/tw\/us-fees"/);
assert.match(html, /href="\/tw\/us-broker"/);
assert.match(html, /href="\/tw\/us-deposit"/);
assert.match(html, /href="\/tw\/us-market-hours"/);
assert.match(html, /firstrade\.com\/accounts\/referral\?im_ref=bIQJ59ginr1r/);
assert.match(html, /開美股帳戶/);
assert.match(html, /不是投資建議/);
assert.match(feeCalculatorHtml(), /value="10000"/);
assert.match(feeCalculatorHtml(), /4,480\.00 TWD/);

const vercel = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);
assert.ok(
  vercel.rewrites.some(
    (entry) =>
      entry.source === '/tw/us-fee-calculator' &&
      entry.destination === '/tw/us-fee-calculator/index.html',
  ),
);
assert.ok(
  vercel.redirects.some(
    (entry) =>
      entry.source === '/tw/fee-calculator' &&
      entry.destination === '/tw/us-fee-calculator' &&
      entry.permanent === true,
  ),
);

console.log(
  'US fee calculator passed: dual vs overseas defaults, min commission, buy/sell/round-trip, crawlable CTA.',
);
