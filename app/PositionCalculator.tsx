import { useMemo, useState } from 'react';
import { positionSize } from './positionSize';

const money = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);

export function PositionCalculator() {
  const [equity, setEquity] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('1');
  const [entry, setEntry] = useState('100');
  const [invalidation, setInvalidation] = useState('95');
  const result = useMemo(
    () =>
      positionSize({
        equity: Number(equity),
        riskPercent: Number(riskPercent),
        entry: Number(entry),
        invalidation: Number(invalidation),
      }),
    [equity, riskPercent, entry, invalidation],
  );
  return (
    <section className="guide-calc" aria-labelledby="position-calc-title">
      <h2 id="position-calc-title">單筆部位試算</h2>
      <p>
        公式：可承受虧損 = 資金 × 風險比例；參考股數 = 可承受虧損 ÷（進場價 − 失效價），無條件捨去。不含滑價、費用與匯率。
      </p>
      <form
        className="guide-calc-grid"
        onSubmit={(event) => event.preventDefault()}
      >
        <label>
          帳戶資金（USD）
          <input
            inputMode="decimal"
            value={equity}
            onChange={(e) => setEquity(e.target.value)}
            aria-label="帳戶資金美元"
          />
        </label>
        <label>
          單筆風險（%）
          <input
            inputMode="decimal"
            value={riskPercent}
            onChange={(e) => setRiskPercent(e.target.value)}
            aria-label="單筆風險百分比"
          />
        </label>
        <label>
          進場價（USD）
          <input
            inputMode="decimal"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            aria-label="進場價美元"
          />
        </label>
        <label>
          失效價（USD）
          <input
            inputMode="decimal"
            value={invalidation}
            onChange={(e) => setInvalidation(e.target.value)}
            aria-label="失效價美元"
          />
        </label>
      </form>
      {result.ok ? (
        <dl>
          <div>
            <dt>可承受虧損</dt>
            <dd>{money(result.riskAmount)}</dd>
          </div>
          <div>
            <dt>每股風險</dt>
            <dd>{money(result.perShare)}</dd>
          </div>
          <div>
            <dt>參考股數</dt>
            <dd>{result.shares.toLocaleString('zh-TW')}</dd>
          </div>
          <div>
            <dt>部位約當金額</dt>
            <dd>{money(result.notional)}</dd>
          </div>
        </dl>
      ) : (
        <p className="guide-calc-error">
          {result.reason}
        </p>
      )}
    </section>
  );
}
