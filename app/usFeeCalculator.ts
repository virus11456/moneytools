export type FeeSide = 'buy' | 'sell' | 'round-trip';

export type FeeCalcInput = {
  notionalUsd: number;
  sharePriceUsd: number;
  side: FeeSide;
  fxRate: number;
  dualPerShareUsd: number;
  dualMinUsd: number;
  dualFxSpreadPct: number;
  usCommissionUsd: number;
  usWireTwd: number;
  usFxSpreadPct: number;
  usSellFeePerMillionUsd: number;
};

export type PathFees = {
  label: string;
  commissionUsd: number;
  extraUsd: number;
  wireTwd: number;
  fxTwd: number;
  totalTwd: number;
  pctOfNotional: number;
};

export type FeeCompare = {
  shares: number;
  notionalTwd: number;
  sides: number;
  dual: PathFees;
  us: PathFees;
  deltaTwd: number;
};

export const FEE_CALC_UPDATED = '2026-09-17';

export const DEFAULT_FEE_INPUT: FeeCalcInput = {
  notionalUsd: 10000,
  sharePriceUsd: 100,
  side: 'round-trip',
  fxRate: 32,
  dualPerShareUsd: 0.02,
  dualMinUsd: 20,
  dualFxSpreadPct: 0.5,
  usCommissionUsd: 0,
  usWireTwd: 300,
  usFxSpreadPct: 0.3,
  usSellFeePerMillionUsd: 27.8,
};

export function parseFeeSide(value: unknown): FeeSide {
  if (value === 'buy' || value === 'sell' || value === 'round-trip') {
    return value;
  }
  return 'round-trip';
}

export function finiteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function shareCount(input: Pick<FeeCalcInput, 'notionalUsd' | 'sharePriceUsd'>) {
  const notional = finiteNumber(input.notionalUsd);
  const price = finiteNumber(input.sharePriceUsd);
  if (!(notional >= 0) || !(price > 0)) return Number.NaN;
  return notional / price;
}

function sideCount(side: FeeSide) {
  return side === 'round-trip' ? 2 : 1;
}

function includeFunding(side: FeeSide) {
  return side === 'buy' || side === 'round-trip';
}

function includeSellFees(side: FeeSide) {
  return side === 'sell' || side === 'round-trip';
}

function fxConversions(side: FeeSide) {
  return sideCount(side);
}

function pct(totalTwd: number, notionalTwd: number) {
  if (!(notionalTwd > 0) || !Number.isFinite(totalTwd)) return Number.NaN;
  return (totalTwd / notionalTwd) * 100;
}

export function compareUsBrokerFees(input: FeeCalcInput): FeeCompare {
  const notionalUsd = Math.max(0, finiteNumber(input.notionalUsd));
  const fxRate = Math.max(0, finiteNumber(input.fxRate));
  const shares = shareCount(input);
  const sides = sideCount(input.side);
  const notionalTwd = notionalUsd * fxRate;
  const dualPerShare = Math.max(0, finiteNumber(input.dualPerShareUsd));
  const dualMin = Math.max(0, finiteNumber(input.dualMinUsd));
  const dualFxPct = Math.max(0, finiteNumber(input.dualFxSpreadPct));
  const usCommission = Math.max(0, finiteNumber(input.usCommissionUsd));
  const usWire = Math.max(0, finiteNumber(input.usWireTwd));
  const usFxPct = Math.max(0, finiteNumber(input.usFxSpreadPct));
  const usSecPerMillion = Math.max(0, finiteNumber(input.usSellFeePerMillionUsd));

  const dualPerSide =
    Number.isFinite(shares) ? Math.max(shares * dualPerShare, dualMin) : Number.NaN;
  const dualCommissionUsd = dualPerSide * sides;
  const dualFxTwd = notionalTwd * (dualFxPct / 100) * fxConversions(input.side);
  const dualTotalTwd = dualCommissionUsd * fxRate + dualFxTwd;

  const usCommissionUsd = usCommission * sides;
  const usSecUsd = includeSellFees(input.side)
    ? notionalUsd * (usSecPerMillion / 1_000_000)
    : 0;
  const usWireTwd = includeFunding(input.side) ? usWire : 0;
  const usFxTwd = notionalTwd * (usFxPct / 100) * fxConversions(input.side);
  const usTotalTwd = (usCommissionUsd + usSecUsd) * fxRate + usWireTwd + usFxTwd;

  return {
    shares,
    notionalTwd,
    sides,
    dual: {
      label: '台灣複委託（示意）',
      commissionUsd: dualCommissionUsd,
      extraUsd: 0,
      wireTwd: 0,
      fxTwd: dualFxTwd,
      totalTwd: dualTotalTwd,
      pctOfNotional: pct(dualTotalTwd, notionalTwd),
    },
    us: {
      label: '海外直開／Firstrade 風格（示意）',
      commissionUsd: usCommissionUsd,
      extraUsd: usSecUsd,
      wireTwd: usWireTwd,
      fxTwd: usFxTwd,
      totalTwd: usTotalTwd,
      pctOfNotional: pct(usTotalTwd, notionalTwd),
    },
    deltaTwd: dualTotalTwd - usTotalTwd,
  };
}

export function formatMoney(value: number, currency: 'TWD' | 'USD') {
  if (!Number.isFinite(value)) return '—';
  return `${value.toLocaleString('zh-TW', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function formatPct(value: number) {
  if (!Number.isFinite(value)) return '—';
  return `${value.toLocaleString('zh-TW', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export function formatShares(value: number) {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('zh-TW', {
    maximumFractionDigits: 4,
  });
}

function attr(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function resultRows(result: FeeCompare) {
  return `<table class="guide-table fee-calc-table">
  <thead>
    <tr><th>項目（示意／非報價）</th><th>台灣複委託</th><th>海外直開／Firstrade 風格</th></tr>
  </thead>
  <tbody>
    <tr><th>約當股數</th><td colspan="2" data-role="shares">${formatShares(result.shares)}</td></tr>
    <tr><th>佣金合計</th><td data-role="dual-commission">${formatMoney(result.dual.commissionUsd, 'USD')}</td><td data-role="us-commission">${formatMoney(result.us.commissionUsd, 'USD')}</td></tr>
    <tr><th>賣出監管費估</th><td>未單列（可能含在複委託費率）</td><td data-role="us-sec">${formatMoney(result.us.extraUsd, 'USD')}</td></tr>
    <tr><th>電匯／匯出手續費</th><td>常內含在兌換，預設 0</td><td data-role="us-wire">${formatMoney(result.us.wireTwd, 'TWD')}</td></tr>
    <tr><th>匯率價差估</th><td data-role="dual-fx">${formatMoney(result.dual.fxTwd, 'TWD')}</td><td data-role="us-fx">${formatMoney(result.us.fxTwd, 'TWD')}</td></tr>
    <tr><th>摩擦合計</th><td data-role="dual-total">${formatMoney(result.dual.totalTwd, 'TWD')}</td><td data-role="us-total">${formatMoney(result.us.totalTwd, 'TWD')}</td></tr>
    <tr><th>約佔成交金額</th><td data-role="dual-pct">${formatPct(result.dual.pctOfNotional)}</td><td data-role="us-pct">${formatPct(result.us.pctOfNotional)}</td></tr>
  </tbody>
</table>
<p class="fee-calc-delta">複委託 − 海外直開 ≈ <strong data-role="delta">${formatMoney(result.deltaTwd, 'TWD')}</strong>。正數表示這組示意數字下，複委託摩擦較高；改參數後結論可能相反。</p>`;
}

export function feeCalculatorHtml(input: FeeCalcInput = DEFAULT_FEE_INPUT): string {
  const result = compareUsBrokerFees(input);
  return `<div id="us-fee-calc" class="fee-calc" data-us-fee-calculator>
  <p class="fee-calc-note">預設值更新日期：${FEE_CALC_UPDATED}。下列區間是為了讓你看「成本長什麼樣子」，<strong>不是牌告、也不是本站報價</strong>。指令碼未執行時，表格仍顯示同一組預設結果。</p>
  <form class="fee-calc-form" action="#us-fee-calc" method="get">
    <fieldset>
      <legend>這筆交易</legend>
      <div class="fee-calc-grid">
        <label>成交金額（USD）
          <input name="notionalUsd" type="number" min="0" step="100" value="${attr(input.notionalUsd)}" />
        </label>
        <label>股價（USD，用來估股數）
          <input name="sharePriceUsd" type="number" min="0.01" step="0.01" value="${attr(input.sharePriceUsd)}" />
        </label>
        <label>計算哪一邊
          <select name="side">
            <option value="buy"${input.side === 'buy' ? ' selected' : ''}>只算買入</option>
            <option value="sell"${input.side === 'sell' ? ' selected' : ''}>只算賣出</option>
            <option value="round-trip"${input.side === 'round-trip' ? ' selected' : ''}>買入＋賣出（來回）</option>
          </select>
        </label>
        <label>匯率（TWD／1 USD，示意）
          <input name="fxRate" type="number" min="0.01" step="0.01" value="${attr(input.fxRate)}" />
        </label>
      </div>
    </fieldset>
    <div class="fee-calc-compare">
      <fieldset>
        <legend>台灣複委託（可調示意）</legend>
        <div class="fee-calc-grid">
          <label>每股佣金（USD）
            <input name="dualPerShareUsd" type="number" min="0" step="0.001" value="${attr(input.dualPerShareUsd)}" />
          </label>
          <label>單邊最低佣金（USD）
            <input name="dualMinUsd" type="number" min="0" step="0.1" value="${attr(input.dualMinUsd)}" />
          </label>
          <label>兌換價差（％，每邊）
            <input name="dualFxSpreadPct" type="number" min="0" step="0.05" value="${attr(input.dualFxSpreadPct)}" />
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend>海外直開／Firstrade 風格（可調示意）</legend>
        <div class="fee-calc-grid">
          <label>單邊佣金（USD）
            <input name="usCommissionUsd" type="number" min="0" step="0.01" value="${attr(input.usCommissionUsd)}" />
          </label>
          <label>本次匯出電匯（TWD；買入／來回才計）
            <input name="usWireTwd" type="number" min="0" step="10" value="${attr(input.usWireTwd)}" />
          </label>
          <label>銀行換匯價差（％，每邊）
            <input name="usFxSpreadPct" type="number" min="0" step="0.05" value="${attr(input.usFxSpreadPct)}" />
          </label>
          <label>賣出監管費示意（USD／百萬成交）
            <input name="usSellFeePerMillionUsd" type="number" min="0" step="0.1" value="${attr(input.usSellFeePerMillionUsd)}" />
          </label>
        </div>
      </fieldset>
    </div>
  </form>
  ${resultRows(result)}
  <p class="fee-calc-note">未計入滑價、平台月費、不活躍費、中轉行扣款、報價費與稅務。若美元留在海外帳戶、不換回台幣，可把海外直開匯差調成 0 或只算單邊。請以券商與銀行最新公告為準。</p>
</div>`;
}
