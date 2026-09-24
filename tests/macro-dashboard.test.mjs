import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMacroDashboard } from '../app/macroDashboard.ts';

const dates = (values) => values.map((value, index) => ({ date: `2026-01-${String(index + 1).padStart(2, '0')}`, value }));
const payload = (series) => ({ generatedAt: '2026-09-24T00:00:00Z', series: Object.fromEntries(Object.entries(series).map(([id, values]) => [id, { points: dates(values) }])) });

test('requires at least two available signals instead of inventing a conclusion', () => {
  const [growth] = buildMacroDashboard(payload({ WEI: [1.2] }));
  assert.equal(growth.tone, 'insufficient');
  assert.equal(growth.availableCount, 1);
});

test('strict zero boundary is not treated as expansion', () => {
  const [growth] = buildMacroDashboard(payload({ WEI: [0], GDP: [0] }));
  assert.equal(growth.tone, 'caution');
  assert.equal(growth.evidence[0].tone, 'caution');
  assert.equal(growth.evidence[1].tone, 'caution');
});

test('mixed inflation directions stay mixed and expose each rule', () => {
  const inflation = buildMacroDashboard(payload({
    CPIAUCSL: [3, 3, 3, 3, 2.5],
    CPILFESL: [3, 3, 3, 3, 3.5],
    PPIACO: [2, 2, 2, 2, 2.05],
  }))[2];
  assert.equal(inflation.tone, 'mixed');
  assert.deepEqual(inflation.evidence.map((row) => row.tone), ['positive', 'caution', 'neutral']);
  assert.ok(inflation.evidence.every((row) => row.rule.length > 10));
});

test('yield curve uses the latest 10-year minus 2-year values', () => {
  const financial = buildMacroDashboard(payload({ DGS10: [4.2], DGS2: [4.5], VIXCLS: [18] }))[3];
  const curve = financial.evidence[0];
  assert.equal(curve.tone, 'caution');
  assert.match(curve.value, /-0.3/);
  assert.equal(financial.tone, 'mixed');
});
