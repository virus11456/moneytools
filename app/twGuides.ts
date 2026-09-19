export const TW_GUIDES = [
  {
    href: '/tw/us-broker',
    label: '券商比較',
    title: '美股券商／開戶比較｜Stocktools',
    description:
      '台灣投資人比較海外直開與複委託的開戶路徑、資金與費用結構。示意區間非即時報價，請核對券商官網。',
  },
  {
    href: '/tw/us-deposit',
    label: '入金匯款',
    title: '美股入金與匯款：台灣電匯到海外券商｜Stocktools',
    description:
      '開好海外美股帳戶後，如何用銀行電匯入金：SWIFT／ABA、換匯、到帳天數與中間行扣款。示意非報價。',
  },
  {
    href: '/tw/us-tax',
    label: 'W-8BEN',
    title: 'W-8BEN 與美股預扣稅：台灣投資人概覽｜Stocktools',
    description:
      '海外券商核准後為什麼要填 W-8BEN：股息預扣與資本利得的常見結構。教育概覽，不是稅務建議。',
  },
  {
    href: '/tw/us-etf',
    label: '美股 ETF',
    title: '台灣怎麼買美股 ETF：複委託與海外券商｜Stocktools',
    description:
      '台灣投資人買美股 ETF 的兩條路：複委託與海外券商。教育整理，不是投資建議。',
  },
  {
    href: '/tw/us-fee-calculator',
    label: '手續費試算',
    title: '美股複委託 vs 海外券商費用試算｜Stocktools',
    description:
      '用示意數字比較複委託與海外直開的佣金、最低費用、匯費與來回成本。預設不是報價，可改成你的券商費率。',
  },
  {
    href: '/tw/us-watchlist',
    label: '觀察名單',
    title: '觀察名單怎麼用｜Stocktools',
    description:
      '說明 stocktools 自選清單只存在瀏覽器、不改變篩選規則，並連回美股與台股研究頁。',
  },
  {
    href: '/tw/risk-plan',
    label: '風險規劃',
    title: '交易風險規劃｜Stocktools',
    description:
      '說明 Stocktools 如何計算成交密集觀察區、失效價位、參考目標與報酬風險比，並提醒缺口、費用與滑價未納入。不是獲利保證。',
  },
  {
    href: '/tw/us-market-hours',
    label: '美股開盤',
    title: '美股開盤時間與休市日曆｜Stocktools',
    description:
      '看美股現在開不開盤、下次開盤／收盤的台北與紐約時間，以及今年與明年 NYSE 休市日。',
  },
  {
    href: '/tw/us-open-account',
    label: '開戶步驟',
    title: '台灣怎麼開美股帳戶：步驟、文件與複委託｜Stocktools',
    description:
      '台灣投資人開美股帳戶的常見步驟：選券商、線上申請、護照／身分證明、W-8BEN、入金到第一筆交易。教育整理，不是投資建議。',
  },
  {
    href: '/tw/us-dividend',
    label: '美股配息',
    title: '美股除息日與配息：台灣投資人怎麼領｜Stocktools',
    description:
      '說明除息日、股權登記日與發放日，以及海外券商或複委託怎麼入帳。教育整理，不是投資建議。',
  },
] as const;

export type TwGuideHref = (typeof TW_GUIDES)[number]['href'];
