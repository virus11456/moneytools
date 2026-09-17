export type GuideFaq = { q: string; a: string };

export type GuidePageDef = {
  slug: string;
  path: string;
  navLabel: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  lead: string;
  toolHref: string;
  toolLabel: string;
  sections: { id: string; title: string; html: string }[];
  faqs?: GuideFaq[];
};

export function siteOrigin() {
  const fromVite = (
    import.meta as ImportMeta & { env?: Record<string, string | undefined> }
  ).env;
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    fromVite?.NEXT_PUBLIC_SITE_URL ||
    'https://stocktools.cc';
  return raw.replace(/\/$/, '');
}

export function affiliateUrl() {
  const fromVite = (
    import.meta as ImportMeta & { env?: Record<string, string | undefined> }
  ).env;
  return String(
    process.env.NEXT_PUBLIC_AFFILIATE_URL ||
      process.env.VITE_AFFILIATE_URL ||
      fromVite?.NEXT_PUBLIC_AFFILIATE_URL ||
      fromVite?.VITE_AFFILIATE_URL ||
      '',
  ).trim();
}

export const RISK_DISCLAIMER =
  '本頁與 Stocktools 僅提供公開資料的研究整理，不是投資建議、買賣委託或獲利保證。股票可能下跌、停牌或損失本金；缺口、匯率、稅務與交易成本未完整納入模型。請以你自己的風險承受度做判斷。';

export const GUIDE_PAGES: GuidePageDef[] = [
  {
    slug: 'us-account',
    path: '/tw/us-account',
    navLabel: '美股開戶',
    title: '美股開戶與複委託比較｜Stocktools',
    description:
      '用檢查清單比較台灣投資人常見的美股複委託與海外券商開戶條件，不含推薦券商。開戶後可用 Stocktools 每日雙重分析觀察名單。',
    eyebrow: '開戶前先看懂路徑',
    h1: '美股開戶：複委託還是海外帳戶？',
    lead: '先分清帳戶類型與費用、交易時間、報稅責任，再決定要不要開戶。Stocktools 不是券商，也不替任何經紀商排名。',
    toolHref: '/',
    toolLabel: '開啟美股雙重分析',
    sections: [
      {
        id: 'why',
        title: '這頁能幫你做什麼',
        html: `<p>台灣投資人買美股，常見兩條路：透過本地券商<strong>複委託</strong>，或自行<strong>開立海外券商帳戶</strong>。兩者都能下單美股，但開戶文件、交易時間、費用結構、公司行動處理與報稅方式不同。</p>
<p>本頁提供可自行核對的檢查清單，不推薦特定券商、不提供追蹤連結，也不暗示「開戶就能獲利」。開戶只是取得下單通道；標的研究請回到 <a href="/">美股雙重分析</a> 與 <a href="/#watchlist">觀察池</a>。</p>`,
      },
      {
        id: 'compare',
        title: '複委託 vs 海外帳戶：比什麼',
        html: `<p>下表是結構差異，不是評分。實際費率、是否支援盤前盤後、最低開戶門檻，都以你正在申請的券商最新公告為準。</p>
<table class="guide-table">
  <thead>
    <tr><th>檢查項</th><th>複委託（本地券商代下單）</th><th>海外券商帳戶</th></tr>
  </thead>
  <tbody>
    <tr><th>開戶與身份</th><td>多半沿用既有台股帳戶與身份驗證</td><td>需另做身份驗證，常見要準備護照、地址與稅務身份文件</td></tr>
    <tr><th>資金路徑</th><td>台幣出入、由券商處理換匯與交割</td><td>多半需自行匯出美元，留意匯費、中轉行與到帳時間</td></tr>
    <tr><th>交易時間</th><td>下單窗口常綁本地營業時間與轉單時段</td><td>較接近美股盤中，能否改單、盤前盤後仍看券商</td></tr>
    <tr><th>費用</th><td>常見為每股或每筆手續費＋匯費；請索取完整費率表</td><td>常見為佣金、匯費、不活躍費、交割或提領費；逐項核對</td></tr>
    <tr><th>公司行動</th><td>股利、分割、選擇權多由本地券商轉知</td><td>需自己追蹤券商通知與除權息時程</td></tr>
    <tr><th>報稅與紀錄</th><td>本地對帳單較完整，仍須自行確認申報義務</td><td>可能要自行保存英文對帳單；申報方式因帳戶而異</td></tr>
  </tbody>
</table>
<p>稅務、匯率與美國預提稅都可能影響實際拿回的現金。本頁<strong>不構成稅務建議</strong>；請核對財政部說明與券商文件，必要時詢問有執照的專業人士。</p>`,
      },
      {
        id: 'checklist',
        title: '開戶前檢查清單',
        html: `<ol class="guide-steps">
  <li>確認你要的是長期持有通道，還是需要盤中改單、盤前盤後或選擇權。</li>
  <li>向券商索取「完整」費率：交易佣金、匯費、最低收費、不活躍費、美國交易所相關費用。</li>
  <li>問清楚美股報價是即時還是延遲、是否另收行情費。</li>
  <li>確認公司行動、股利入帳幣別，以及萬一要終止帳戶時如何把資金轉回台灣。</li>
  <li>寫下你能接受的最大單筆損失，再開戶；工具不會替你下單或控管部位。</li>
</ol>
<p>檢查完若仍要開戶，可使用頁面下方的外部連結（僅在網站設定了網址時顯示）。連結由設定檔提供，Stocktools 不預設任何券商或追蹤代碼。</p>`,
      },
      {
        id: 'after',
        title: '開戶之後：用本站做研究，而不是追當沖訊號',
        html: `<p>帳戶只解決「能不能下單」。Stocktools 解決的是「這家公司目前有沒有通過本站公開規則」：</p>
<ul>
  <li><a href="/">美股首頁</a>：每日掃描後，基本面通過者分成第一區（基本面＋技術面）與第二區（等待趨勢）。</li>
  <li><a href="/#watchlist">觀察池</a>：尚未通過基本面的名單，避免只看到「已合格」而忽略大多數標的。</li>
  <li><a href="/stock/AAPL">個股頁範例（AAPL）</a>：查看各項門檻、失效價位與資料日期。</li>
</ul>
<p>通過篩選不代表應該買進，READY 也不保證後續上漲。研究流程見 <a href="/tw/watchlist-guide">觀察名單與雙重分析</a>，風險規則見 <a href="/tw/risk-plan">風險與停損規劃</a>。</p>`,
      },
    ],
  },
  {
    slug: 'watchlist-guide',
    path: '/tw/watchlist-guide',
    navLabel: '觀察名單',
    title: '美股觀察名單與雙重分析怎麼用｜Stocktools',
    description:
      '說明 Stocktools 美股基本面與技術面雙重篩選、兩區分類、觀察池與收藏名單，並連到每日工具與個股頁。通過條件不是獲利保證。',
    eyebrow: '產品使用說明',
    h1: '怎麼用本站的美股觀察名單與雙重分析',
    lead: '先看企業品質，再看趨勢是否跟上。Stocktools 把通過基本面的股票分成兩區，其餘留在觀察池，沒有綜合推薦分數。',
    toolHref: '/#watchlist',
    toolLabel: '前往美股觀察池',
    sections: [
      {
        id: 'flow',
        title: '雙重分析在做什麼',
        html: `<p>每日掃描會對觀察宇宙（公開 S&amp;P 500 成分加上可編輯的 <code>watchlist.json</code>）套用同一套規則，不是全美股、也不是即時報價。</p>
<div class="guide-cards">
  <article><h3>01｜基本面</h3><p>最近完整年度營收 ≥ 1 億美元、年增 ≥ 15%、營業利益率 &gt; 0、營業現金流 &gt; 0、自由現金流 &gt; 0。限美元財報；金融與不動產暫不適用。</p></article>
  <article><h3>02｜技術面</h3><p>收盤 &gt; 50 日均線 &gt; 200 日均線，兩條均線高於 20 個交易日前，近 20 日平均成交金額 ≥ 1,000 萬美元。</p></article>
</div>
<p>兩步都通過且資料有效 → <strong>第一區</strong>。只有基本面通過 → <strong>第二區</strong>，等待趨勢或資料補齊。基本面未通過者不進兩區，可在觀察池查看。</p>
<p><a href="/#overview">看今日總覽</a> · <a href="/#group-dual">第一區</a> · <a href="/#group-fundamental">第二區</a></p>`,
      },
      {
        id: 'watchlist',
        title: '觀察池、today 標記與收藏',
        html: `<ul>
  <li><strong>觀察池</strong>（<a href="/#watchlist">#watchlist</a>）列出掃描宇宙中的狀態，可用篩選查看尚未通過基本面的名字。</li>
  <li><strong>today</strong> 只標記「當下台北日」新通過基本面或雙重條件的變動，不是當沖訊號。</li>
  <li><strong>收藏</strong>存在你的瀏覽器，不會上傳帳號；換裝置或清資料就會消失。</li>
</ul>
<p>搜尋框可查已掃描代號；按搜尋可向資料源查其他美股。查詢本身不會把股票加入每日宇宙。直接網址例如 <a href="/stock/NVDA">/stock/NVDA</a>。</p>`,
      },
      {
        id: 'ready',
        title: 'READY 還要多通過什麼',
        html: `<p>第一區只代表企業與趨勢規則通過。顯示 READY 還需要進場條件同時成立，包括：距離成交密集區上緣 ≤ 2%、報酬／風險 ≥ 2:1，以及量價確認（收盤高於前日高、量能達標、當日低點觸及區間且收盤守住下緣）。</p>
<p>目標價取前 63 個交易日最高價；失效價見 <a href="/tw/risk-plan">風險與停損規劃</a>。READY 是規則標籤，<strong>不保證</strong>買進後上漲，也未回測證實這些門檻是最佳參數。</p>
<p>個股頁可對照每日掃描與即時查詢差異；即時查詢走 <code>/api/analyze</code>，可能快取約兩小時，仍會標示資料時間。</p>`,
      },
      {
        id: 'limits',
        title: '資料限制（請先讀）',
        html: `<p>來源為 Yahoo Finance / yfinance 非官方介面，可能延遲、缺漏、修訂或限流。年度財報落後公司現況；價格用已完成日線，不是盤中成交。公開成分股名單可能落後官方調整。</p>
<p>商業模式、護城河、估值、財報品質與事件風險，仍要你自己做。規則原始碼公開於 <a href="https://github.com/virus11456/moneytools" rel="noreferrer">GitHub</a>。</p>`,
      },
    ],
  },
  {
    slug: 'risk-plan',
    path: '/tw/risk-plan',
    navLabel: '風險規劃',
    title: '美股風險與停損規劃｜失效價位說明｜Stocktools',
    description:
      '說明 Stocktools 如何計算成交密集觀察區、失效價位、參考目標與報酬風險比，並提醒缺口、費用與滑價未納入。不是獲利保證。',
    eyebrow: '先寫失效條件',
    h1: '風險與停損：本站怎麼標失效價位',
    lead: '進場研究前先知道「錯了就離開」的價格。Stocktools 用日線成交量近似區與 ATR 算出失效價，沒有幫你下停損單。',
    toolHref: '/',
    toolLabel: '在美股工具查看個股風險欄',
    sections: [
      {
        id: 'zone',
        title: '觀察區不是支撐保證',
        html: `<p>進場模組取最近 126 個交易日，把每日成交量歸入 24 個典型價格區間。最接近現價下方、成交量至少達峰值 50% 的區間，標成潛在觀察區。</p>
<p>這是<strong>粗略的日線近似</strong>，不是投資人持倉、也不是逐筆成交剖面。觀察區可以被跌破；跌破不自動等於「機會更好」。</p>`,
      },
      {
        id: 'invalidation',
        title: '失效價、參考目標、報酬／風險',
        html: `<ul>
  <li><strong>失效價</strong>＝觀察區下緣 − 0.5 × ATR14。用來描述規則上的「結構不成立」，不是券商停損單。</li>
  <li><strong>參考目標</strong>＝前 63 個交易日最高價。這是歷史高點，不是預測目標。</li>
  <li><strong>報酬／風險</strong>用最新收盤估算；目標必須高於現價，失效價必須為正且低於現價。READY 要求此比值 ≥ 2。</li>
</ul>
<p>費用、缺口、滑價、隔夜跳空與股利調整都<strong>沒有</strong>進入這個數字。實際成交可能遠差於頁面上的比值。</p>
<p>在個股頁（例如 <a href="/stock/AAPL">AAPL</a>）可看到各項數值與尚缺條件。資料不足時不會把缺值當成 0 來美化比值。</p>`,
      },
      {
        id: 'practice',
        title: '實務上可以怎麼寫自己的計畫',
        html: `<ol class="guide-steps">
  <li>先確認基本面與技術面是否真的通過，而不是只看徽章顏色。</li>
  <li>把失效價抄下來，預先決定跌破後要減碼或離開，而不是盤中再找理由。</li>
  <li>部位大小用「失效時你虧得起的金額」反推，不要用「如果漲到目標能賺多少」反推。</li>
  <li>美股有盤前盤後與財報缺口，限價單與停損單都可能沒成交在你預期的價格。</li>
</ol>
<p>本站不計算建議股數、不連結券商下單，也不提供保證停損。開戶路徑見 <a href="/tw/us-account">美股開戶與複委託</a>。</p>`,
      },
    ],
  },
  {
    slug: 'us-vs-tw',
    path: '/tw/us-vs-tw',
    navLabel: '台股 vs 美股',
    title: '台股與美股篩選工具差在哪｜Stocktools',
    description:
      '比較 Stocktools 美股與台股頁的規則、資料來源、更新方式與進場模組差異，協助選擇要使用哪一邊的每日篩選。',
    eyebrow: '同一品牌，兩套獨立規則',
    h1: '台股頁和美股頁，差在哪裡？',
    lead: '美股與台股是兩套獨立研究頁，門檻、財報口徑與資料來源都不同。不要把一邊的通過，理解成另一邊也通過。',
    toolHref: '/tw',
    toolLabel: '開啟台股篩選',
    sections: [
      {
        id: 'split',
        title: '先選市場，再看名單',
        html: `<p>頂部切換 <a href="/">美股</a> 與 <a href="/tw">台股</a>。收藏名單也分開存放（美股與台股互不共用）。</p>
<table class="guide-table">
  <thead>
    <tr><th></th><th>美股 <a href="/">/</a></th><th>台股 <a href="/tw">/tw</a></th></tr>
  </thead>
  <tbody>
    <tr><th>宇宙</th><td>公開 S&amp;P 500 成分＋可編輯觀察池，並非全美股</td><td>本站收錄的上市／上櫃名單，並非全部台股</td></tr>
    <tr><th>基本面口徑</th><td>最近完整年度、美元；營收 ≥ 1 億美元</td><td>近四季、新台幣；營收 ≥ 10 億元</td></tr>
    <tr><th>排除產業</th><td>金融、不動產（一般公司規則暫不適用）</td><td>金融保險、建材營造暫不適用</td></tr>
    <tr><th>技術面流動性</th><td>近 20 日平均成交金額 ≥ 1,000 萬美元</td><td>近 20 日平均成交額 ≥ 2,000 萬元</td></tr>
    <tr><th>進場與失效</th><td>有成交密集區、確認條件、失效價與報酬／風險</td><td>有條件明細；不提供與美股相同的即時重算</td></tr>
    <tr><th>資料來源</th><td>Yahoo Finance / yfinance，可能延遲或限流</td><td>公開市場與財報來源，頁面可核對連結</td></tr>
    <tr><th>即時查詢</th><td>未在當日宇宙者可走 <code>/api/analyze</code></td><td>讀每日發布的 JSON，重新讀取不會即時重算</td></tr>
  </tbody>
</table>`,
      },
      {
        id: 'same',
        title: '兩邊相同的原則',
        html: `<ul>
  <li>先企業、再趨勢；通過基本面才進入兩區。</li>
  <li>缺資料不視為通過；嚴格大於 0 的項目，等於 0 也不通過。</li>
  <li>沒有綜合推薦分數，也不承諾報酬。</li>
  <li><code>today</code> 只描述當日規則狀態變化，不是進場指令。</li>
</ul>
<p>台股個股頁範例：<a href="/tw/stock/2330">2330</a>。美股個股頁範例：<a href="/stock/AAPL">AAPL</a>。</p>`,
      },
      {
        id: 'choose',
        title: '該從哪一頁開始',
        html: `<p>主要看美股、或正在考慮複委託／海外帳戶 → 先用 <a href="/">美股雙重分析</a>，並讀 <a href="/tw/us-account">開戶說明</a>。</p>
<p>主要看台股、要比對本業成長與均線 → 用 <a href="/tw">台股篩選</a>。兩邊規則版本獨立，門檻沒有互相換算。</p>`,
      },
    ],
  },
  {
    slug: 'faq',
    path: '/tw/faq',
    navLabel: '常見問題',
    title: '常見問題｜Stocktools 美股與台股研究工具',
    description:
      '關於 Stocktools 雙重分析、觀察名單、美股複委託開戶、風險標示與資料來源的常見問題。本站不保證獲利。',
    eyebrow: 'FAQ',
    h1: 'Stocktools 常見問題',
    lead: '先找答案，再進工具。若頁面與實際畫面不一致，以工具上的門檻與資料時間為準。',
    toolHref: '/',
    toolLabel: '返回美股工具',
    faqs: [
      {
        q: 'Stocktools 會幫我下單或推薦買哪一檔嗎？',
        a: '不會。本站只顯示規則有沒有通過，以及資料時間。沒有綜合分數、沒有目標報酬承諾，也沒有券商下單介面。',
      },
      {
        q: 'READY 是不是可以買？',
        a: '不是。READY 代表進場相關規則在該次資料上都通過，不保證後續價格上漲，也不處理你的部位大小、稅與費用。',
      },
      {
        q: '觀察名單和每日宇宙有什麼差別？',
        a: '每日宇宙是掃描清單（公開 S&P 500 成分加上編輯中的 watchlist）。頁面上的觀察池用來瀏覽狀態；瀏覽器收藏只存在本機。搜尋未掃描代號不會自動把它加入隔日宇宙。',
      },
      {
        q: '你們推薦哪一家複委託或海外券商？',
        a: '不推薦。開戶說明只列檢查項。若網站管理員設定了 NEXT_PUBLIC_AFFILIATE_URL，頁面會顯示標示清楚的外部開戶按鈕；未設定則完全隱藏，不會出現預設券商或追蹤代碼。',
      },
      {
        q: '失效價可以當成停損單價格嗎？',
        a: '它只是研究用的規則描述（觀察區下緣減 0.5 倍 ATR14）。實際停損單可能因缺口、盤前盤後或流動性而沒有成交在該價位。',
      },
      {
        q: '台股頁的資料和美股一樣即時重算嗎？',
        a: '不一樣。台股頁讀每日發布的紀錄；「重新讀取」只是再抓一次已發布檔案。美股未在宇宙中的代號可另走分析 API，結果可能快取，並標示時間戳。',
      },
      {
        q: '資料從哪裡來？會不會錯？',
        a: '美股主要透過非官方 Yahoo Finance 介面；台股使用可核對的公開來源。免費來源可能延遲、缺漏、修訂或限流。請對照原始財報與交易所公告。',
      },
    ],
    sections: [
      {
        id: 'more',
        title: '還想往下看',
        html: `<ul>
  <li><a href="/tw/us-account">美股開戶與複委託比較</a></li>
  <li><a href="/tw/watchlist-guide">觀察名單與雙重分析</a></li>
  <li><a href="/tw/risk-plan">風險與停損規劃</a></li>
  <li><a href="/tw/us-vs-tw">台股 vs 美股工具差異</a></li>
</ul>`,
      },
    ],
  },
];

export function normalizePath(path: string) {
  const p = path.split('?')[0].split('#')[0];
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
  return p || '/';
}

export function findGuide(path: string) {
  const p = normalizePath(path);
  return GUIDE_PAGES.find((page) => page.path === p);
}

export function isGuidePath(path: string) {
  return !!findGuide(path);
}
