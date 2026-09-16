import { TwShell } from './TwShell';
import { TW_GUIDES } from './twGuides';

const PAGE = TW_GUIDES[0];

export default function TwBrokerCompare() {
  return (
    <TwShell
      current={PAGE.href}
      title={PAGE.title}
      description={PAGE.description}
      eyebrow="開戶路徑"
      heading="美股券商怎麼開，先看路徑再比費用。"
      lede="台灣投資人常見兩條路：海外直開，或透過國內券商複委託。這頁只整理比較面向，不推薦特定券商。"
    >
      <p className="tw-seo-updated">
        內容更新日期：2026-09-16。下列費率是公開市場常見<strong>示意區間</strong>
        ，不是本站報價，也尚未對接即時費率表。下單前請以券商官網與合約為準。
      </p>
      <section className="tw-panel">
        <h2>先選路徑，再談哪一家</h2>
        <p>
          開戶比較常被簡化成「哪家最便宜」。實際差異多半出在資金怎麼換成美元、你能不能接受英文對帳單，以及下單時間是否卡在台灣營業時間。費用可以之後用
          <a href="/tw/fee-calculator">手續費／匯費試算</a>自己代入。
        </p>
      </section>
      <section className="tw-panel">
        <h2>兩條開戶路徑</h2>
        <div className="tw-seo-grid">
          <article>
            <h3>海外券商直開</h3>
            <p>
              以個人名義開立海外證券帳戶，自行完成 W-8BEN、匯入美元、報稅與對帳單保存。優點是費率與商品通常較完整；成本是文件、時差與你要自己核對官方費率。
            </p>
            <ul>
              <li>資金：台幣先換成美元，再電匯或第三方匯兌。</li>
              <li>下單：多為 24 小時網頁／App，美股盤中即時性較高。</li>
              <li>稅務：美股預扣與台灣申報仍要自己處理。</li>
            </ul>
          </article>
          <article>
            <h3>台灣複委託</h3>
            <p>
              透過國內券商或銀行代下美股。台幣下單、中文客服，流程較接近台股習慣；缺點是費率結構往往較多層，且下單窗口可能較短。
            </p>
            <ul>
              <li>資金：多半留在台灣帳戶，由券商兌換與交割。</li>
              <li>下單：看營業時間與複委託系統，未必覆蓋美股夜盤全程。</li>
              <li>對帳單：中文較完整，但仍要核對美元計價與匯差。</li>
            </ul>
          </article>
        </div>
      </section>
      <section className="tw-panel">
        <h2>費用結構怎麼讀（示意區間）</h2>
        <p className="tw-muted">
          數字僅供理解費率「長什麼樣子」。本站沒有券商官方授權的即時費率表，因此不寫成確定報價。
        </p>
        <table className="tw-compare">
          <caption>示意區間，非即時報價 · 更新 2026-09-16</caption>
          <thead>
            <tr>
              <th>項目</th>
              <th>海外直開（示意）</th>
              <th>台灣複委託（示意）</th>
              <th>要比對的官方出處</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>股票佣金</td>
              <td>約 USD 0–1／筆，或每股 USD 0–0.005</td>
              <td>約每股 USD 0.01–0.03，或更高的最低消費</td>
              <td>佣金／美國市場收費表</td>
            </tr>
            <tr>
              <td>匯出手續費</td>
              <td>銀行電匯常見約 TWD 100–800／筆</td>
              <td>常內含在兌換或「國外交易手續費」</td>
              <td>銀行／券商匯款與兌換說明</td>
            </tr>
            <tr>
              <td>匯率價差</td>
              <td>看你用哪家換匯，可能大於匯費本身</td>
              <td>看複委託採用的牌告或議價匯率</td>
              <td>當日兌換匯率與價差說明</td>
            </tr>
            <tr>
              <td>平台／帳戶費</td>
              <td>有的免收，有的收低活動費</td>
              <td>較少獨立帳戶費，但可能有最低佣金</td>
              <td>帳戶條件、休眠與最低收費</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section className="tw-panel">
        <h2>開戶前可自問的五件事</h2>
        <ol className="tw-seo-list">
          <li>我能不能讀懂英文交易確認與公司行動通知？</li>
          <li>第一次匯美元的銀行費率，會不會比佣金還高？</li>
          <li>我是否需要在台灣營業時間找人處理掛單與錯單？</li>
          <li>美股失效價位與報酬／風險，我有沒有寫進自己的計畫？見<a href="/tw/risk">交易風險規劃</a>。</li>
          <li>這筆交易的摩擦成本，用試算器代入後是否仍划算？</li>
        </ol>
      </section>
    </TwShell>
  );
}
