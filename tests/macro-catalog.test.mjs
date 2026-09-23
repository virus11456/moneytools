import assert from 'node:assert/strict';
import { macroCharts } from '../app/macroCatalog.ts';
assert.equal(macroCharts.length, 20, '總經頁必須完整收錄 20 張圖');
assert.deepEqual(macroCharts.map((c) => c.number), Array.from({length:20},(_,i)=>i+1));
assert.equal(new Set(macroCharts.map((c) => c.id)).size, 20, '圖表 id 不可重複');
for (const chart of macroCharts) {
  assert.ok(chart.series.length >= 2, `${chart.id} 至少應有兩個比較序列`);
  for (const series of chart.series) {
    assert.ok(series.source && series.sourceUrl && series.frequency, `${chart.id}/${series.id} 必須揭露來源與頻率`);
  }
}
console.log('macro catalog tests passed');
