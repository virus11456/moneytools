export type PositionSizeInput = {
  equity: number;
  riskPercent: number;
  entry: number;
  invalidation: number;
};

export type PositionSizeResult =
  | {
      ok: true;
      riskAmount: number;
      perShare: number;
      shares: number;
      notional: number;
    }
  | { ok: false; reason: string };

export function positionSize(input: PositionSizeInput): PositionSizeResult {
  const { equity, riskPercent, entry, invalidation } = input;
  if (
    ![equity, riskPercent, entry, invalidation].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  ) {
    return { ok: false, reason: '請輸入大於 0 的資金、風險比例、進場價與失效價。' };
  }
  if (riskPercent > 100) {
    return { ok: false, reason: '單筆風險比例不能超過 100%。' };
  }
  if (invalidation >= entry) {
    return {
      ok: false,
      reason: '此試算僅適用做多：失效價須低於進場價。',
    };
  }
  const riskAmount = (equity * riskPercent) / 100;
  const perShare = entry - invalidation;
  const shares = Math.floor(riskAmount / perShare);
  if (shares < 1) {
    return {
      ok: false,
      reason: '以目前風險預算，連 1 股的每股風險都無法覆蓋。請降低每股風險或提高可承受虧損。',
    };
  }
  return {
    ok: true,
    riskAmount,
    perShare,
    shares,
    notional: shares * entry,
  };
}
