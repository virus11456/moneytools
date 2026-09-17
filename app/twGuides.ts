export const TW_GUIDES = [
  {
    href: '/tw/us-broker',
    label: '券商比較',
    title: '美股券商／開戶比較｜Stocktools',
    description:
      '台灣投資人比較海外直開與複委託的開戶路徑、資金與費用結構。示意區間非即時報價，請核對券商官網。',
  },
  {
    href: '/tw/fee-calculator',
    label: '手續費試算',
    title: '美股手續費／匯費試算｜Stocktools',
    description:
      '用本機試算器估算佣金、匯費與匯率對一次進出的摩擦成本。預設為示意區間，可改成你的券商費率。',
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
] as const;

export type TwGuideHref = (typeof TW_GUIDES)[number]['href'];
