export const TW_GUIDES = [
  {
    href: '/tw/broker-compare',
    label: '券商比較',
    title: '美股券商／開戶比較｜Moneytools',
    description:
      '台灣投資人比較海外直開與複委託的開戶路徑、資金與費用結構。示意區間非即時報價，請核對券商官網。',
  },
  {
    href: '/tw/fee-calculator',
    label: '手續費試算',
    title: '美股手續費／匯費試算｜Moneytools',
    description:
      '用本機試算器估算佣金、匯費與匯率對一次進出的摩擦成本。預設為示意區間，可改成你的券商費率。',
  },
  {
    href: '/tw/watchlist',
    label: '觀察名單',
    title: '觀察名單怎麼用｜Moneytools',
    description:
      '說明 moneytools 自選清單只存在瀏覽器、不改變篩選規則，並連回美股與台股研究頁。',
  },
  {
    href: '/tw/risk',
    label: '風險規劃',
    title: '交易風險規劃｜Moneytools',
    description:
      '雙重分析如何看失效價位、報酬風險與尚未計入的費用。READY 是條件通過，不是下單指令。',
  },
] as const;

export type TwGuideHref = (typeof TW_GUIDES)[number]['href'];
