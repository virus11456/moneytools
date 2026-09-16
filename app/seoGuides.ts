export const SITE_ORIGIN = 'https://moneytools-eight.vercel.app';

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  items?: string[];
};

export type SeoGuide = {
  path: string;
  title: string;
  description: string;
  kicker: string;
  h1: string;
  lede: string;
  liveLinks: { href: string; label: string }[];
  sections: GuideSection[];
  calculator?: boolean;
};

export const SEO_GUIDES: SeoGuide[] = [
  {
    path: '/tw/us-watchlist',
    title: '美股觀察名單與每日變化｜Moneytools',
    description:
      '對應本站「觀察池全覽」與「每日變化」：列出最近一次掃描的基本面通過標的；today 只標記當日新通過條件。日線資料，非即時報價。',
    kicker: '對應首頁 · 觀察池全覽／每日變化',
    h1: '美股觀察名單怎麼讀',
    lede: '觀察名單不是預測榜，而是最近一次掃描裡、仍符合公開規則的公司清單。頁面上的數量會隨每次掃描改變，本頁不另列股票，也不編造績效。',
    liveLinks: [
      { href: '/#watchlist', label: '打開美股觀察池全覽' },
      { href: '/#daily-changes', label: '打開每日變化' },
      { href: '/#overview', label: '打開基本面通過總覽' },
    ],
    sections: [
      {
        heading: '首頁上實際有哪些區塊',
        paragraphs: [
          '美股首頁把掃描結果分成可核對的區塊，而不是單一推薦分數。',
        ],
        items: [
          '基本面通過總覽：最近一次掃描中，基本面五項都通過的標的。',
          '第一區｜基本面＋技術面皆符合：企業與趨勢都達標。',
          '第二區｜基本面符合、技術面待確認：企業達標，趨勢或資料仍在等。',
          '每日變化：與前一次有效紀錄比較後，目前仍成立的條件變化。',
          '觀察池全覽：完整掃描結果，包含尚未通過基本面或資料不足者。',
        ],
      },
      {
        heading: 'today 代表什麼',
        paragraphs: [
          'today 只標記「今日新通過基本面」或「今日新通過雙重條件」，而且行情日或財報期也已更新。進場狀態在 READY 與 APPROACHING 之間切換，會出現在每日變化，但不會因此再貼一次 today。',
          '第一次掃描或新加入觀察池的代號只建立比較基準，不會假裝它們今天才符合。資料取得失敗或不足，也不會把已知狀態清成失效。',
        ],
      },
      {
        heading: '使用時請一併核對時間',
        paragraphs: [
          '清單用的是已完成交易日的日線，不是盤中報價。首頁會顯示掃描完成時間、行情日期與台北時間。若看到「目前為前次掃描」或待補資料，請先看時間戳，再決定要不要點進個股。',
        ],
      },
    ],
  },
  {
    path: '/tw/us-dual-analysis',
    title: '美股基本面與技術面怎麼一起看｜Moneytools',
    description:
      '先檢查企業品質（營收、成長、獲利、現金流），再看均線與流動性。雙重通過與等待確認分屬兩個互斥分區，沒有綜合分數。',
    kicker: '對應首頁 · 篩選邏輯／兩區分類',
    h1: '美股技術面＋基本面怎麼一起看',
    lede: '本站把研究拆成兩步：先確認企業品質，再看價格趨勢與流動性是否跟上。兩區是分類，不是關卡；同一檔只會出現在其中一區。',
    liveLinks: [
      { href: '/#group-dual', label: '打開第一區（雙重通過）' },
      { href: '/#group-fundamental', label: '打開第二區（等待確認）' },
    ],
    sections: [
      {
        heading: '01 基本面：成長，也要賺得到現金',
        paragraphs: [
          '基本面五項都通過，才會進入首頁兩區。門檻是本站一致套用的研究規則，不是經過回測證明的最佳參數。',
        ],
        items: [
          '最近完整年度營收 ≥ 1 億美元。',
          '年度營收年增率 ≥ 15%。',
          '營業利益率 > 0。',
          '年度營業現金流 > 0。',
          '自由現金流 > 0（營業現金流 − 資本支出絕對值）。',
        ],
      },
      {
        heading: '02 技術面：企業達標，再等趨勢配合',
        paragraphs: [
          '技術面四項都通過，才從第二區進第一區。均線相等不算通過；資料缺漏也不視為通過。',
        ],
        items: [
          '收盤價 > 50 日均線 > 200 日均線。',
          '50 日均線高於 20 個交易日前。',
          '200 日均線高於 20 個交易日前。',
          '近 20 日平均成交金額 ≥ 1,000 萬美元。',
        ],
      },
      {
        heading: '這些規則刻意沒做的事',
        paragraphs: [
          '沒有把各項條件加總成分數，也沒有價格預測。金融、不動產與非美元財報不適用這套一般企業規則。財報日期距掃描日超過 550 天、或行情距掃描日超過 5 個日曆日，會標成資料不足。',
          '雙重通過之後，仍要到個股頁檢查進場位置、量價確認與報酬／風險。通過篩選不代表可立即買進。',
        ],
      },
    ],
  },
  {
    path: '/tw/us-risk-calculator',
    title: '美股風險與部位試算｜Moneytools',
    description:
      '用進場價與失效價估算單筆可承受股數。對應個股頁成交密集區、失效價與報酬／風險。不含滑價、費用與匯率。',
    kicker: '對應個股頁 · ENTRY / RISK',
    h1: '風險與部位試算',
    lede: '個股頁會列出成交密集區、距離區間上緣、失效價、參考目標與報酬／風險。下面這個試算只幫你把「單筆願意虧多少」換成股數，不會呼叫後端，也不會存帳戶。',
    liveLinks: [
      { href: '/', label: '回美股首頁搜尋個股' },
    ],
    calculator: true,
    sections: [
      {
        heading: '本站個股頁怎麼定義風險',
        paragraphs: [
          '失效價＝區間下緣 − 0.5 × ATR14。參考目標為前 63 個交易日最高價，並非預測。報酬／風險用最新收盤計算，不含滑價與費用。',
          '成交密集區來自 126 個交易日、24 個價位桶的日線近似，不是實際持倉或逐筆成交分布。支撐可能失效。',
        ],
      },
      {
        heading: '這個試算做什麼、不做什麼',
        paragraphs: [
          '輸入帳戶資金、單筆風險比例、進場價與失效價後，會算出可承受虧損金額、每股風險、無條件捨去後的參考股數，以及對應名目金額。',
          '試算假設做多、失效價低於進場價。沒有匯率換算、沒有選擇權、也沒有保證成交。數字只供核對，不是下單指令。',
        ],
      },
    ],
  },
  {
    path: '/tw/us-ready',
    title: '美股進場條件與 READY 狀態｜Moneytools',
    description:
      'READY 需品質與趨勢通過、距離觀察區 ≤ 2%、報酬／風險 ≥ 2，以及量價確認。規則通過不代表後續報酬。',
    kicker: '對應首頁 · READY／進場條件',
    h1: '什麼時候會顯示 READY',
    lede: 'READY 的意思是：公開規則此刻全部成立。它不是買進訊號保證，也沒有勝敗統計或預期報酬。',
    liveLinks: [
      { href: '/', label: '在美股首頁篩選 READY' },
      { href: '/tw/us-dual-analysis', label: '先讀雙重分析步驟' },
    ],
    sections: [
      {
        heading: '狀態只描述條件，不排序推薦',
        paragraphs: [
          '品質與趨勢通過之後，個股還會依位置再分成幾個狀態：',
        ],
        items: [
          'QUALITY：品質通過，趨勢或回撤仍在等待。',
          'APPROACHING：品質及趨勢通過，距離成交密集區上緣 ≤ 5%，但確認或報酬／風險尚未全部通過。',
          'READY：品質及趨勢通過，距離 ≤ 2%，回測與量價確認、報酬／風險 ≥ 2。',
          'WAIT：基本面未通過。',
          'INCOMPLETE：資料缺漏、過期或不適用。',
        ],
      },
      {
        heading: 'READY 還要同時成立的進場檢查',
        paragraphs: [
          '距離成交密集區上緣 ≤ 2%，報酬／風險 ≥ 2:1，且最新完整日線收盤高於前日最高價、成交量 ≥ 前 20 日平均量、當日最低價觸及區間上緣且收盤守住下緣。缺一不可。',
          '個股頁可查各項數值、失效價與尚缺條件。條件之後失效，狀態也會跟著改；歷史通過不自動保留。',
        ],
      },
    ],
  },
  {
    path: '/tw/us-faq',
    title: '美股研究工具常見問題｜Moneytools',
    description:
      '說明本站與看盤軟體、券商 App 的差異：公開規則、已完成交易日資料、無推薦分數、不下單。並回答掃描範圍與資料限制。',
    kicker: '對應頁尾 · 來源與限制',
    h1: '常見美股工具比較與 FAQ',
    lede: 'Moneytools 是規則透明的研究頁，不是看盤軟體，也不是券商。以下只比較「這個站實際做什麼」，不引用未核對的產品數字或報酬承諾。',
    liveLinks: [
      { href: '/', label: '打開美股雙重分析' },
      { href: '/tw', label: '打開台股篩選' },
    ],
    sections: [
      {
        heading: '和常見工具差在哪',
        paragraphs: [
          '比較重點是工作性質，不是誰比較準。本站沒有對外部產品做評測。',
        ],
        items: [
          '看盤軟體／即時報價：提供盤中價格與圖表。本站用已完成交易日日線做條件檢查。',
          '券商 App：開戶、下單、庫存。本站不下單，也還沒接合作券商連結。',
          '綜合評分選股：常把多項指標收成一個分數。本站逐項列出通過或未通過，不加總。',
          'Moneytools：公開門檻、每日掃描快照、個股條件明細；研究工具不等同買賣指令。',
        ],
      },
      {
        heading: '掃描範圍有多大',
        paragraphs: [
          '每日掃描公開 S&P 500 成分加上可編輯的觀察池，並非全美股。名單來源與取得時間寫在首頁頁尾；公開名單可能落後官方調整。',
          '搜尋可查其他美股，但單次查詢不會把代號加入每日掃描宇宙，也不會改 today 或每日變化。',
        ],
      },
      {
        heading: '資料從哪裡來，有哪些限制',
        paragraphs: [
          '美股行情與財報來自 Yahoo Finance / yfinance（免費、非官方介面），可能延遲、缺漏或限流。年度財報有落後性。',
          '台股是獨立規則與獨立資料管線，門檻與幣別都不同；請用頁頂「美股／台股」切換，不要把兩邊的數字直接混用。',
        ],
      },
      {
        heading: '收藏會不會同步',
        paragraphs: [
          '自選清單存在這個瀏覽器。清除網站資料會消失，也不會跨裝置同步。收藏不會改變篩選規則，也不會自動加入每日掃描。',
        ],
      },
    ],
  },
];

export function normalizePathname(pathname: string) {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

export function guideByPath(pathname: string) {
  const path = normalizePathname(pathname);
  return SEO_GUIDES.find((guide) => guide.path === path);
}

export const SEO_GUIDE_PATHS = SEO_GUIDES.map((guide) => guide.path);
