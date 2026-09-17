import { TwShell } from './TwShell';
import { TW_GUIDES } from './twGuides';

const PAGE = TW_GUIDES[5];

export default function TwWatchlistGuide() {
  return (
    <TwShell
      current={PAGE.href}
      title={PAGE.title}
      description={PAGE.description}
      eyebrow="本機收藏"
      heading="觀察名單只幫你記住，不幫你保證。"
      lede="星號收藏存在這台裝置的瀏覽器裡。它不會改篩選門檻，也不會把股票加進每日掃描宇宙。"
    >
      <section className="tw-panel">
        <h2>它實際做什麼</h2>
        <p>
          美股與台股各有一份本機名單。點股票旁的星號即可加入或取消；重新打開同一瀏覽器仍會看到。清除網站資料、換裝置或無痕視窗，名單就會不見。
        </p>
        <ul className="tw-seo-list">
          <li>不改變基本面或技術面規則。</li>
          <li>不會向伺服器同步，也沒有帳號登入。</li>
          <li>不會因為收藏就變成 today 或 READY。</li>
        </ul>
      </section>
      <section className="tw-panel">
        <h2>怎麼連回研究頁</h2>
        <div className="tw-seo-grid">
          <article>
            <h3>美股自選</h3>
            <p>
              打開<a href="/#watchlist">美股首頁的觀察池</a>
              ，或在清單勾選「只看自選」。搜尋列仍可查未掃描的代號；查詢結果不會自動寫入每日宇宙。
            </p>
          </article>
          <article>
            <h3>台股本機收藏</h3>
            <p>
              到<a href="/tw">台股篩選</a>
              勾選「本機收藏」，只顯示你已點星號的上市或上櫃公司。個股頁
              <code>/tw/stock/2330</code> 也可直接收藏。
            </p>
          </article>
        </div>
      </section>
      <section className="tw-panel">
        <h2>建議怎麼用</h2>
        <p>
          先讓規則幫你分流，再把「還想追蹤」的股票收進名單，而不是把觀察名單當成推薦清單。進場前仍要看失效價位與費用，見
          <a href="/tw/risk-plan">交易風險規劃</a>。
        </p>
      </section>
    </TwShell>
  );
}
