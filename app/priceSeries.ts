export type PriceBar = { date: string; close: number };
// Reject unusable rows rather than joining across missing prices or inventing values.
export function priceSeries(value: unknown) {
  if (!Array.isArray(value) || value.length < 2) return null;
  let previous = '';
  for (const bar of value) {
    if (!bar || typeof bar !== 'object' || typeof bar.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(bar.date) ||
      !Number.isFinite(Date.parse(`${bar.date}T00:00:00Z`)) ||
      new Date(`${bar.date}T00:00:00Z`).toISOString().slice(0, 10) !== bar.date ||
      bar.date <= previous || typeof bar.close !== 'number' ||
      !Number.isFinite(bar.close) || bar.close <= 0) return null;
    previous = bar.date;
  }
  const bars = value as PriceBar[];
  const low = bars.reduce((a,b) => Math.min(a,b.close), Infinity);
  const high = bars.reduce((a,b) => Math.max(a,b.close), -Infinity);
  const chartLow = low * .98, chartHigh = high * 1.02;
  const change = bars[bars.length - 1].close / bars[0].close - 1;
  if (![chartLow,chartHigh,chartHigh-chartLow,change].every(Number.isFinite) || chartHigh <= chartLow) return null;
  return {bars, low, high, chartLow, chartHigh, change};
}
export function visiblePriceZone(low: unknown, high: unknown, chartLow: number, chartHigh: number) {
  if (typeof low !== 'number' || typeof high !== 'number' ||
    !Number.isFinite(low) || !Number.isFinite(high) || low <= 0 || high < low ||
    high < chartLow || low > chartHigh) return null;
  return {low:Math.max(low,chartLow),high:Math.min(high,chartHigh)};
}
