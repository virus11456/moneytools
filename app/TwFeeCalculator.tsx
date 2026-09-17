import { useMemo, useState } from 'react';
import { TwShell } from './TwShell';
import { TW_GUIDES } from './twGuides';

const PAGE = TW_GUIDES[1];
const UPDATED = '2026-09-16';

function money(value: number, currency: 'TWD' | 'USD') {
  if (!Number.isFinite(value)) return '—';
  return `${value.toLocaleString('zh-TW', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export default function TwFeeCalculator() {
  const [principalTwd, setPrincipalTwd] = useState(300000);
  const [fxRate, setFxRate] = useState(32);
  const [wireTwd, setWireTwd] = useState(300);
  const [commissionUsd, setCommissionUsd] = useState(1);
  const [sides, setSides] = useState(2);
  const result = useMemo(() => {
    const principal = Math.max(0, principalTwd);
    const rate = Math.max(0.01, fxRate);
    const wire = Math.max(0, wireTwd);
    const commission = Math.max(0, commissionUsd) * Math.max(1, sides);
    const usdAfterWire = Math.max(0, principal - wire) / rate;
    const frictionTwd = wire + commission * rate;
    const frictionPct = principal > 0 ? (frictionTwd / principal) * 100 : 0;
    return { usdAfterWire, commission, frictionTwd, frictionPct };
  }, [principalTwd, fxRate, wireTwd, commissionUsd, sides]);
  return (
    <TwShell
      current={PAGE.href}
      title={PAGE.title}
      description={PAGE.description}
      eyebrow="費用摩擦"
      heading="手續費與匯費，先算摩擦再談進出。"
      lede="這是瀏覽器內的示意試算，沒有連到任何券商。預設數字是標示過的區間中點，請改成你帳戶實際費率。"
    >
      <p className="tw-seo-updated">
        預設值更新日期：{UPDATED}。匯率預設 32 TWD／USD、電匯 300 元、單邊佣金 1
        美元，都是示意，不是牌告。完整路徑說明見
        <a href="/tw/us-broker">美股券商／開戶比較</a>。
      </p>
      <section className="tw-panel">
        <h2>代入你的數字</h2>
        <form className="tw-calc" onSubmit={(e) => e.preventDefault()}>
          <label>
            準備投入（新台幣）
            <input
              type="number"
              min={0}
              step={1000}
              value={principalTwd}
              onChange={(e) => setPrincipalTwd(Number(e.target.value))}
            />
          </label>
          <label>
            匯率（TWD／1 USD，示意）
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={fxRate}
              onChange={(e) => setFxRate(Number(e.target.value))}
            />
          </label>
          <label>
            匯出／兌換手續費（TWD，示意）
            <input
              type="number"
              min={0}
              step={10}
              value={wireTwd}
              onChange={(e) => setWireTwd(Number(e.target.value))}
            />
          </label>
          <label>
            單邊佣金（USD，示意）
            <input
              type="number"
              min={0}
              step={0.01}
              value={commissionUsd}
              onChange={(e) => setCommissionUsd(Number(e.target.value))}
            />
          </label>
          <label>
            計算幾邊
            <select
              value={sides}
              onChange={(e) => setSides(Number(e.target.value))}
            >
              <option value={1}>只算買入 1 邊</option>
              <option value={2}>買入＋賣出 2 邊</option>
            </select>
          </label>
        </form>
        <dl className="tw-calc-result">
          <div>
            <dt>扣除匯費後約可買入</dt>
            <dd>{money(result.usdAfterWire, 'USD')}</dd>
          </div>
          <div>
            <dt>佣金合計</dt>
            <dd>{money(result.commission, 'USD')}</dd>
          </div>
          <div>
            <dt>匯費＋佣金摩擦（TWD）</dt>
            <dd>{money(result.frictionTwd, 'TWD')}</dd>
          </div>
          <div>
            <dt>約佔本金</dt>
            <dd>{result.frictionPct.toFixed(2)}%</dd>
          </div>
        </dl>
        <p className="tw-muted">
          未計入價差滑價、SEC
          等監管費、平台月費與台美稅務。雙重分析的報酬／風險也尚未扣這些成本，見
          <a href="/tw/risk-plan">交易風險規劃</a>。
        </p>
      </section>
    </TwShell>
  );
}
