import { TwShell } from './TwShell';
import { TW_GUIDES } from './twGuides';

const PAGE = TW_GUIDES[4];

export default function TwRiskGuide() {
  return (
    <TwShell
      current={PAGE.href}
      title={PAGE.title}
      description={PAGE.description}
      eyebrow="風險規劃"
      heading="風險先寫下來，再決定要不要靠近。"
      lede="stocktools 先做基本面篩選，再做技術面篩選與進場條件檢查。通過條件不是下單指令，也還沒扣手續費。"
    >
      <section className="tw-panel">
        <h2>為什麼分開檢查</h2>
        <p>
          美股頁把基本面通過、趨勢到位、靠近成交密集區、量價確認與報酬／風險拆開。台股頁同樣先確認成長與現金流，再用均線與流動性分流。兩區分類是「現在看到什麼」，不是評分排名。回到
          <a href="/tw">台股篩選</a>
          可對照每日名單；美股規則在
          <a href="/">美股篩選</a>。
        </p>
      </section>
      <section className="tw-panel">
        <h2>進場前至少寫下三個數字</h2>
        <ol className="tw-seo-list">
          <li>
            <strong>失效價位。</strong>
            美股規則用觀察區下緣減 0.5 倍
            ATR14。價格跌破代表這次假設不成立，不是再等反彈的理由。
          </li>
          <li>
            <strong>參考目標。</strong>
            以最近一波可核對的高點當作描述，不是預測價。目標必須高於現價，失效必須低於現價。
          </li>
          <li>
            <strong>報酬／風險。</strong>
            READY 要求至少 2:1，且用最新收盤計算。未計入手續費、匯費、滑價與稅。
          </li>
        </ol>
      </section>
      <section className="tw-panel">
        <h2>費用會吃掉帳面的報酬／風險</h2>
        <p>
          同樣的 2:1，在複委託或電匯成本高時可能只剩不到 1.5:1。請用
          <a href="/tw/us-fees">手續費／匯費說明</a>或
          <a href="/tw/us-fee-calculator">手續費／匯費試算</a>
          代入實際費率，再開戶路徑見
          <a href="/tw/us-broker">美股券商比較</a>
          ，入金步驟見
          <a href="/tw/us-deposit">美股入金與匯款</a>
          。READY、APPROACHING 只說明規則有沒有通過。
        </p>
      </section>
      <section className="tw-panel">
        <h2>這份工具不會幫你做的事</h2>
        <ul className="tw-seo-list">
          <li>不保證後續報酬，也沒有回測績效承諾。</li>
          <li>不代替券商風險揭露、投資適合度或稅務建議。</li>
          <li>資料可能延遲、缺漏或被上游限流；缺值不當成通過。</li>
        </ul>
      </section>
    </TwShell>
  );
}
