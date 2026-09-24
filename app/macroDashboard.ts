export type MacroPoint = { date: string; value: number };
export type MacroSeries = { latestDate?: string; points: MacroPoint[]; error?: string };
export type MacroPayload = { generatedAt: string; series: Record<string, MacroSeries> };

export type EvidenceTone = 'positive' | 'neutral' | 'caution' | 'missing';
export type DashboardTone = 'positive' | 'mixed' | 'caution' | 'insufficient';

export type MacroEvidence = {
  label: string;
  value: string;
  date?: string;
  tone: EvidenceTone;
  rule: string;
  chartId: string;
};

export type MacroLens = {
  id: string;
  title: string;
  status: string;
  tone: DashboardTone;
  summary: string;
  evidence: MacroEvidence[];
  availableCount: number;
};

const number = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 });

function points(payload: MacroPayload | null, id: string) {
  return (payload?.series[id]?.points || []).filter((point) => Number.isFinite(point.value));
}

function latest(payload: MacroPayload | null, id: string) {
  return points(payload, id).at(-1);
}

function previous(payload: MacroPayload | null, id: string, offset: number) {
  const rows = points(payload, id);
  return rows.length > offset ? rows.at(-(offset + 1)) : undefined;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function evidence(
  payload: MacroPayload | null,
  id: string,
  label: string,
  chartId: string,
  unit: string,
  rule: string,
  evaluate: (value: number, rows: MacroPoint[]) => EvidenceTone,
): MacroEvidence {
  const rows = points(payload, id);
  const point = rows.at(-1);
  if (!point) return { label, value: '待資料', tone: 'missing', rule, chartId };
  return {
    label,
    value: `${number.format(point.value)}${unit}`,
    date: point.date,
    tone: evaluate(point.value, rows),
    rule,
    chartId,
  };
}

function directionEvidence(
  payload: MacroPayload | null,
  id: string,
  label: string,
  chartId: string,
  unit: string,
  lookback: number,
  threshold: number,
  lowerIsPositive: boolean,
): MacroEvidence {
  const current = latest(payload, id);
  const prior = previous(payload, id, lookback);
  const rule = `比較目前值與約 ${lookback} 期前；變化超過 ${number.format(threshold)}${unit} 才判定方向`;
  if (!current || !prior) return { label, value: '待資料', tone: 'missing', rule, chartId };
  const change = current.value - prior.value;
  const direction = Math.abs(change) <= threshold ? 'neutral' : (change < 0) === lowerIsPositive ? 'positive' : 'caution';
  return {
    label,
    value: `${number.format(current.value)}${unit}（${change >= 0 ? '+' : ''}${number.format(change)}）`,
    date: current.date,
    tone: direction,
    rule,
    chartId,
  };
}

function buildLens(
  id: string,
  title: string,
  evidenceRows: MacroEvidence[],
  labels: { positive: string; mixed: string; caution: string; insufficient: string },
  summaries: { positive: string; mixed: string; caution: string; insufficient: string },
): MacroLens {
  const available = evidenceRows.filter((row) => row.tone !== 'missing');
  const positives = available.filter((row) => row.tone === 'positive').length;
  const cautions = available.filter((row) => row.tone === 'caution').length;
  let tone: DashboardTone = 'mixed';
  if (available.length < 2) tone = 'insufficient';
  else if (cautions >= 2 && cautions > positives) tone = 'caution';
  else if (positives >= 2 && positives > cautions) tone = 'positive';
  return {
    id,
    title,
    tone,
    status: labels[tone],
    summary: summaries[tone],
    evidence: evidenceRows,
    availableCount: available.length,
  };
}

export function buildMacroDashboard(payload: MacroPayload | null): MacroLens[] {
  const claims = points(payload, 'ICSA');
  const claimsCurrent = claims.at(-1);
  const claimsBaseline = claims.length >= 14 ? average(claims.slice(-14, -1).map((row) => row.value)) : undefined;
  const claimsEvidence: MacroEvidence = !claimsCurrent || claimsBaseline === undefined
    ? { label: '初領失業金', value: '待資料', tone: 'missing', rule: '目前值不高於前 13 期平均視為就業壓力未擴大', chartId: 'employment' }
    : {
      label: '初領失業金',
      value: `${number.format(claimsCurrent.value / 1000)} 千人`,
      date: claimsCurrent.date,
      tone: claimsCurrent.value <= claimsBaseline ? 'positive' : claimsCurrent.value > claimsBaseline * 1.1 ? 'caution' : 'neutral',
      rule: '目前值不高於前 13 期平均視為穩健；高出逾 10% 視為壓力',
      chartId: 'employment',
    };

  const tenYear = latest(payload, 'DGS10');
  const twoYear = latest(payload, 'DGS2');
  const curveEvidence: MacroEvidence = !tenYear || !twoYear
    ? { label: '10年－2年利差', value: '待資料', tone: 'missing', rule: '利差 ≥ 0 為正斜率；< 0 為倒掛', chartId: 'rates' }
    : {
      label: '10年－2年利差',
      value: `${number.format(tenYear.value - twoYear.value)} 個百分點`,
      date: tenYear.date > twoYear.date ? twoYear.date : tenYear.date,
      tone: tenYear.value - twoYear.value >= 0 ? 'positive' : 'caution',
      rule: '利差 ≥ 0 為正斜率；< 0 為倒掛',
      chartId: 'rates',
    };

  const sp500 = points(payload, 'SP500');
  const spLatest = sp500.at(-1);
  const spAverage = sp500.length >= 200 ? average(sp500.slice(-200).map((row) => row.value)) : undefined;
  const spTrendEvidence: MacroEvidence = !spLatest || spAverage === undefined
    ? { label: '標普 500 長期趨勢', value: '待資料', tone: 'missing', rule: '指數高於最近 200 個交易日均值視為多方趨勢', chartId: 'breadth' }
    : {
      label: '標普 500 長期趨勢',
      value: `${number.format(spLatest.value)}（200日均 ${number.format(spAverage)}）`,
      date: spLatest.date,
      tone: spLatest.value >= spAverage ? 'positive' : 'caution',
      rule: '指數高於最近 200 個交易日均值視為多方趨勢',
      chartId: 'breadth',
    };

  return [
    buildLens('growth', '景氣與就業', [
      evidence(payload, 'WEI', '每週經濟指數', 'wei-gdp', '%', 'WEI > 0 視為經濟活動仍擴張', (value) => value > 0 ? 'positive' : 'caution'),
      evidence(payload, 'GDP', '名目 GDP 年增', 'wei-gdp', '%', '年增率 > 0 視為名目經濟仍擴張', (value) => value > 0 ? 'positive' : 'caution'),
      directionEvidence(payload, 'PAYEMS', '非農就業', 'employment', ' 千人', 1, 0, false),
      claimsEvidence,
    ], {
      positive: '擴張訊號較多', mixed: '訊號分歧', caution: '放緩訊號較多', insufficient: '資料不足',
    }, {
      positive: '經濟活動與勞動市場多數仍支持擴張。', mixed: '景氣與就業方向不一致，需分項確認。', caution: '多項景氣或就業訊號轉弱，宜提高警覺。', insufficient: '至少要有兩項公開數據才能交叉判讀。',
    }),
    buildLens('demand', '家庭與需求', [
      evidence(payload, 'PCE', '個人消費年增', 'household', '%', '年增率 > 0 視為需求仍擴張', (value) => value > 0 ? 'positive' : 'caution'),
      evidence(payload, 'PI', '個人收入年增', 'household', '%', '年增率 > 0 視為收入仍成長', (value) => value > 0 ? 'positive' : 'caution'),
      evidence(payload, 'RSAFS', '零售銷售年增', 'retail', '%', '年增率 > 0 視為零售需求仍成長', (value) => value > 0 ? 'positive' : 'caution'),
      evidence(payload, 'HOUST', '新屋開工年增', 'housing-supply', '%', '年增率 > 0 視為住宅供給活動改善', (value) => value > 0 ? 'positive' : 'caution'),
    ], {
      positive: '需求仍有支撐', mixed: '需求分歧', caution: '需求轉弱', insufficient: '資料不足',
    }, {
      positive: '收入、消費與住宅活動多數維持成長。', mixed: '家庭支出與住宅活動不同步。', caution: '消費或住宅需求多項落入負成長。', insufficient: '至少要有兩項公開數據才能交叉判讀。',
    }),
    buildLens('inflation', '通膨壓力', [
      directionEvidence(payload, 'CPIAUCSL', '整體 CPI 年增', 'oil-cpi', '%', 3, 0.2, true),
      directionEvidence(payload, 'CPILFESL', '核心 CPI 年增', 'oil-cpi', '%', 3, 0.2, true),
      directionEvidence(payload, 'PPIACO', '工業品 PPI 年增', 'copper-ppi', '%', 3, 0.2, true),
    ], {
      positive: '通膨正在降溫', mixed: '通膨方向分歧', caution: '通膨壓力升高', insufficient: '資料不足',
    }, {
      positive: '多項物價年增率較約三期前下降。', mixed: '整體、核心與上游物價方向不一致。', caution: '多項物價年增率較約三期前上升。', insufficient: '至少要有兩項物價數據才能判讀方向。',
    }),
    buildLens('financial', '利率與信用', [
      curveEvidence,
      evidence(payload, 'VIXCLS', 'VIX', 'credit-risk', '', 'VIX < 20 偏平穩；20–30 中性；> 30 壓力升高', (value) => value < 20 ? 'positive' : value > 30 ? 'caution' : 'neutral'),
      evidence(payload, 'BAMLH0A3HYC', '高收益債利差', 'credit-risk', '%', '低於 5% 偏平穩；5–8% 中性；> 8% 壓力升高', (value) => value < 5 ? 'positive' : value > 8 ? 'caution' : 'neutral'),
      directionEvidence(payload, 'FEDFUNDS', '政策利率', 'rates', '%', 3, 0.1, true),
    ], {
      positive: '金融條件較穩', mixed: '金融條件分歧', caution: '金融壓力升高', insufficient: '資料不足',
    }, {
      positive: '利率曲線、波動與信用利差多數處於較穩狀態。', mixed: '利率、信用與波動訊號並不同步。', caution: '信用、波動或利率曲線出現多項壓力。', insufficient: '至少要有兩項金融數據才能交叉判讀。',
    }),
    buildLens('market', '市場風險', [
      spTrendEvidence,
      evidence(payload, 'VIXCLS', 'VIX 風險溫度', 'credit-risk', '', 'VIX < 20 偏平穩；20–30 中性；> 30 壓力升高', (value) => value < 20 ? 'positive' : value > 30 ? 'caution' : 'neutral'),
      evidence(payload, 'SPX_ABOVE_50', '50日市場廣度', 'breadth', '%', '高於 50% 代表過半成分股站上 50 日均線', (value) => value > 50 ? 'positive' : 'caution'),
      evidence(payload, 'SPX_ABOVE_200', '200日市場廣度', 'breadth', '%', '高於 50% 代表過半成分股站上 200 日均線', (value) => value > 50 ? 'positive' : 'caution'),
    ], {
      positive: '趨勢較穩', mixed: '市場訊號分歧', caution: '風險升高', insufficient: '資料不足',
    }, {
      positive: '價格趨勢、波動與廣度多數偏穩。', mixed: '指數趨勢、波動與市場廣度並不同步。', caution: '市場趨勢或波動出現多項警訊。', insufficient: '公開廣度資料尚缺時，只保留可查核訊號。',
    }),
  ];
}
