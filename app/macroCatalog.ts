export type MacroSeries = {
  id: string;
  label: string;
  color: string;
  unit: string;
  source: string;
  sourceUrl: string;
  frequency: string;
  formula?: string;
  note?: string;
  substitute?: boolean;
};

export type MacroChart = {
  id: string;
  number: number;
  group: '景氣與需求' | '通膨與利率' | '市場風險與籌碼';
  title: string;
  takeaway: string;
  explanation: string;
  caution: string;
  series: MacroSeries[];
};

const fred = (id: string, label: string, color: string, unit: string, frequency: string, formula?: string): MacroSeries => ({
  id, label, color, unit, frequency, formula, source: 'FRED／原始發布機構', sourceUrl: `https://fred.stlouisfed.org/series/${id}`,
});
const market = (id: string, label: string, color: string, unit = '指數'): MacroSeries => ({
  id, label, color, unit, frequency: '日／週', source: '市場行情（Yahoo Finance）', sourceUrl: 'https://finance.yahoo.com/', note: '市場行情僅供研究比對，並非交易所官方即時報價。',
});
const publicSeries = (id: string, label: string, color: string, unit: string, frequency: string, source: string, sourceUrl: string, formula?: string, note?: string): MacroSeries => ({
  id, label, color, unit, frequency, source, sourceUrl, formula, note,
});
const restricted = (id: string, label: string, color: string, source: string, sourceUrl: string, note?: string, frequency = '依發布機構', unit = '指數'): MacroSeries => ({
  id, label, color, unit, frequency, source, sourceUrl, substitute: false,
  note: note ?? '此序列可能受授權限制；未取得可再散布資料前只顯示來源狀態，不以近似值冒充。',
});

export const macroCharts: MacroChart[] = [
  { id: 'employment', number: 1, group: '景氣與需求', title: '就業動能', takeaway: '失業申請先看轉折，非農就業確認企業聘僱。', explanation: '初領與續領失業金上升，通常表示裁員與再就業難度增加；非農月增則反映企業實際新增職位。', caution: '週資料雜訊高；非農有修正，應看數週或數月趨勢。', series: [fred('ICSA','初次申請失業金','#c57042','千人','週','原值 ÷ 1,000'), fred('CCSA','連續申請失業金','#d7b85e','千人','週','原值 ÷ 1,000'), fred('PAYEMS','非農就業月增','#51b9b3','千人','月','本月－上月')] },
  { id: 'household', number: 2, group: '景氣與需求', title: '家庭財務狀況', takeaway: '收入支撐消費，儲蓄率顯示家庭緩衝。', explanation: '收入與消費年增率一起看，可分辨消費是由所得成長支撐，或靠降低儲蓄維持。', caution: '疫情轉移支付造成極端值，不能單看單月。', series: [fred('PCE','個人消費支出年增','#55bdb5','%','月','12 個月年增率'), fred('PI','個人所得年增','#354c50','%','月','12 個月年增率'), fred('PSAVERT','個人儲蓄率','#c97755','%','月')] },
  { id: 'housing-market', number: 3, group: '景氣與需求', title: '房市需求與價格', takeaway: '成交量領先價格，量縮後再看房價是否跟進。', explanation: '新屋與成屋銷售衡量需求，售價與 20 城房價指數顯示價格韌性。', caution: 'Case-Shiller 有發布落後且受授權條款約束。', series: [fred('SPCS20RSA','20 城房價指數','#263d3a','指數','月'), fred('MSPNHSUS','新屋銷售中位價','#55bdb5','千美元','月','原值 ÷ 1,000'), fred('HSN1F','新屋銷售年增','#c66d50','%','月','12 個月年增率'), fred('EXHOSLUSM495S','成屋銷售年增','#d5b760','%','月','12 個月年增率')] },
  { id: 'vehicles', number: 4, group: '景氣與需求', title: '汽車消費', takeaway: '汽車是高單價循環消費，可觀察信用與需求壓力。', explanation: '總銷量與年增率確認需求方向，二手車價格補充供需與融資環境。', caution: 'Manheim 指數屬授權資料；頁面不重製未授權歷史值。', series: [fred('TOTALSA','汽車銷售量','#d8bb65','百萬輛','月'), fred('TOTALSA_YOY','汽車銷售年增','#34444d','%','月','12 個月年增率'), restricted('MANHEIM','二手車價格指數','#4cbdb5','Cox Automotive／Manheim','https://site.manheim.com/en/services/consulting/used-vehicle-value-index.html')] },
  { id: 'retail', number: 5, group: '景氣與需求', title: '零售消費', takeaway: '總零售看大盤，非店面零售補充消費結構變化。', explanation: '零售年增衡量商品消費；非店面零售可看電商與直銷通路強弱。', caution: 'Redbook 為商業授權資料，官方零售資料與其涵蓋範圍不同。', series: [fred('RSAFS','零售銷售年增','#34444d','%','月','12 個月年增率'), fred('MRTSSM4541USN','非店面零售年增','#55bdb5','%','月','12 個月年增率'), restricted('REDBOOK','Redbook 同店銷售','#d9b95d','Redbook Research','https://www.redbookresearch.com/','Johnson Redbook 同店銷售為專有週資料，官方未提供可再散布的完整歷史。普查月零售已畫在同一張圖，頻率與樣本都不同，這個欄位是非替代指標，不把普查數字當成 Redbook。','週','%')] },
  { id: 'housing-supply', number: 6, group: '景氣與需求', title: '房市供給', takeaway: '開工與許可看未來供給，庫存看當下去化壓力。', explanation: '建築許可通常早於開工；成屋庫存與房價年增可判斷供需是否轉鬆。', caution: '月資料波動大，天候也會影響開工。', series: [fred('HOUST','新屋開工年增','#55bdb5','%','月','12 個月年增率'), fred('PERMIT','房屋建築許可年增','#d7b85d','%','月','12 個月年增率'), fred('HOSINVUSM495N','成屋庫存年增','#c87550','%','月','12 個月年增率'), fred('SPCS20RSA_YOY','20 城房價年增','#34444d','%','月','由 SPCS20RSA 計算 12 個月年增率')] },
  { id: 'pmi-durable', number: 7, group: '景氣與需求', title: '企業訂單與資本支出', takeaway: 'PMI 看方向，耐久財與核心資本財看實際訂單。', explanation: '新訂單與核心資本財能確認企業是否真的擴張採購與投資。', caution: 'ISM 指標受授權限制；官方訂單可查核但定義不同。', series: [restricted('ISM_SERVICES','非製造業 PMI','#287a6f','ISM','https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/','ISM 服務業（非製造業）PMI 為專有調查。FRED 已刪除全部 ISM 序列，未取得再散布授權前不發布。紐約、費城、達拉斯的服務業調查只涵蓋一個地區且以 0 為中心，不畫成替代指標。','月'), restricted('ISM_NEWORDERS','製造業新訂單 PMI','#55aeca','ISM','https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/','ISM 製造業新訂單指數為專有調查。FRED NAPMNOI 已隨 ISM 序列刪除，未取得再散布授權前不發布。地區聯準會新訂單以 0 為中心，不畫成替代指標。','月'), fred('DGORDER','耐久財訂單年增','#c97854','%','月','12 個月年增率'), fred('NEWORDER','非國防資本財訂單年增','#d8b95e','%','月','12 個月年增率')] },
  { id: 'wei-gdp', number: 8, group: '景氣與需求', title: '每週經濟指數與 GDP 成長', takeaway: '高頻 WEI 先看景氣轉折，GDP 年增確認整體結果。', explanation: 'WEI 與名目 GDP 年增同時落到負值時，代表高頻活動與總產出都在收縮。', caution: '負值是景氣警訊，不等同 NBER 已正式認定衰退。', series: [fred('WEI','每週經濟指數 WEI','#55bdb5','%','週'), fred('GDP','名目 GDP 年增','#dbad3e','%','季','4 季年增率')] },
  { id: 'copper-ppi', number: 9, group: '通膨與利率', title: '銅金比、PPI 與製造業', takeaway: '銅相對黃金走強，常伴隨工業需求與再通膨預期改善。', explanation: '銅金比代表景氣敏感原料相對避險資產的強弱，再與生產者物價及 PMI 交叉確認。', caution: '比率是市場代理變數，不能視為因果或單獨預測工具。', series: [market('COPPER_GOLD','銅金比','#d8ad48','比率'), fred('PPIFIS','最終需求 PPI 年增','#55bdb5','%','月','12 個月年增率'), restricted('ISM_PMI','製造業 PMI','#35434b','ISM','https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/','ISM 製造業 PMI 為專有調查。FRED NAPM 已於 2016-06-24 應 ISM 要求刪除，未取得再散布授權前不發布。地區聯準會調查不是全國 PMI，不畫成替代指標。','月')] },
  { id: 'oil-cpi', number: 10, group: '通膨與利率', title: '油金比與消費通膨', takeaway: '油價衝擊先反映總 CPI，核心 CPI 用來觀察黏性。', explanation: '油金比衡量能源相對避險資產；總 CPI 與核心 CPI 分別看整體與排除食物能源後的通膨。', caution: '油價不是通膨唯一來源，住房與服務價格可能更持久。', series: [market('OIL_GOLD','油金比','#55bdb5','比率'), fred('CPIAUCSL','CPI 年增','#34444d','%','月','12 個月年增率'), fred('CPILFESL','核心 CPI 年增','#d9b75b','%','月','12 個月年增率')] },
  { id: 'abstract-macro', number: 11, group: '通膨與利率', title: '抽象宏觀經濟', takeaway: '把商品相對價格、政策利率與長債殖利率放在同一張圖看週期。', explanation: '銅金比與油金比反映市場定價，聯邦基金利率反映政策，10 年債殖利率反映長期成長與通膨預期。', caution: '四者尺度不同，圖形用各自座標；只比較方向與轉折。', series: [market('COPPER_GOLD','銅金比','#c9a03c','比率'), market('OIL_GOLD','油金比','#55bdb5','比率'), fred('FEDFUNDS','聯邦基金利率','#dac36d','%','月'), fred('DGS10','10 年期公債殖利率','#34444d','%','日')] },
  { id: 'rates', number: 12, group: '通膨與利率', title: '美國利率結構', takeaway: '短率跟政策，長率反映市場對未來成長與通膨的定價。', explanation: '聯準會政策利率先影響貨幣市場，再傳到 2、5、10 年期公債。', caution: '3M LIBOR 已停止發布；歷史段保留，後續不與 SOFR 假接成同一序列。', series: [fred('FEDFUNDS','政策利率','#d9c26a','%','月'), fred('USD3MTD156N','3M LIBOR（已停刊）','#d37958','%','日'), fred('DGS2','2 年期公債','#55bdb5','%','日'), fred('DGS5','5 年期公債','#83c7c2','%','日'), fred('DGS10','10 年期公債','#34444d','%','日')] },
  { id: 'credit-risk', number: 13, group: '市場風險與籌碼', title: '信用利差、VIX 與 S&P 500', takeaway: '信用利差與 VIX 同升，通常代表市場風險壓力擴散。', explanation: 'CCC 利差看最低評級企業融資壓力，VIX 看股票選擇權隱含波動。', caution: '壓力升高是風險環境訊號，不是精準進出場點。', series: [fred('BAMLH0A3HYC','CCC 信用利差','#55bdb5','百分點','日'), fred('VIXCLS','VIX','#d9c36c','指數','日'), fred('SP500','S&P 500','#34444d','指數','日')] },
  { id: 'aaii', number: 14, group: '市場風險與籌碼', title: 'AAII 散戶情緒', takeaway: '極端悲觀或樂觀可作反向情緒背景，仍需價格確認。', explanation: '多空差與 20 週均線觀察散戶情緒是否長時間偏向同一側。', caution: 'AAII 調查屬授權資料且樣本為自願回覆，未授權前不重製歷史序列。', series: [restricted('AAII_SPREAD','散戶多空差','#55bdb5','AAII','https://www.aaii.com/sentimentsurvey'), restricted('AAII_MA20','20 週均線','#397d72','AAII','https://www.aaii.com/sentimentsurvey'), fred('SP500','S&P 500','#34444d','指數','日')] },
  { id: 'naaim', number: 15, group: '市場風險與籌碼', title: 'NAAIM 經理人曝險', takeaway: '曝險高低顯示主動經理人整體風險偏好。', explanation: '指數與 20 週均線用來看曝險是否持續偏高或偏低。', caution: 'NAAIM 屬調查及授權資料，40／100 僅作歷史情境，不是固定買賣線。', series: [restricted('NAAIM','經理人曝險','#d5b353','NAAIM','https://www.naaim.org/programs/naaim-exposure-index/','NAAIM 曝險指數自 2026-08-01 起需訂閱；公開頁禁止未經許可的商業再散布，不抓取圖表或表格。沒有可再散布的公開替代序列，這個欄位是非替代指標。','週'), restricted('NAAIM_MA20','20 週均線','#c77a5b','NAAIM','https://www.naaim.org/programs/naaim-exposure-index/','20 期均線只能源自可再散布的 NAAIM 原始序列。目前沒有該序列，因此不計算、不手填、不從圖片描點。這個欄位是非替代指標。','週'), fred('SP500','S&P 500','#34444d','指數','日')] },
  { id: 'put-call', number: 16, group: '市場風險與籌碼', title: '股票 Put／Call 比率', takeaway: 'Put 相對 Call 增加，代表避險或看空需求升高。', explanation: '股票 Put／Call 與 20 日均線可降低單日到期與事件造成的雜訊。', caution: 'CBOE 序列受授權條款約束，極端值不等同反轉保證。', series: [restricted('CBOE_PC','股票 Put／Call 比率','#d9bf6a','Cboe','https://www.cboe.com/us/options/market_statistics/'), restricted('CBOE_PC_MA20','20 日均線','#c97755','Cboe','https://www.cboe.com/us/options/market_statistics/'), fred('SP500','S&P 500','#34444d','指數','日')] },
  { id: 'sp500-cot', number: 17, group: '市場風險與籌碼', title: 'S&P 500 投機部位', takeaway: '期貨淨部位顯示大型投機人對股市風險的集中方向。', explanation: '使用 CFTC 可查核的交易人分類資料，與 S&P 500 價格交叉看。', caution: '採 Traders in Financial Futures 的 S&P 500 Consolidated 合約；分類或合約調整會影響跨期比較。', series: [publicSeries('SP500_COT','槓桿基金淨持倉','#55bdb5','口','週','CFTC Traders in Financial Futures','https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm','S&P 500 Consolidated（代碼 13874+）槓桿基金多單－空單'), fred('SP500','S&P 500','#34444d','指數','日')] },
  { id: 'nasdaq-cot', number: 18, group: '市場風險與籌碼', title: 'Nasdaq 100 投機部位', takeaway: '科技股期貨淨部位可補充市場對成長股的集中風險。', explanation: '以 CFTC Nasdaq 100 合約交易人部位，對照 Nasdaq 100 指數。', caution: '採 Traders in Financial Futures 的 Nasdaq-100 Consolidated 合約；不與其他 COT 分類混接。', series: [publicSeries('NASDAQ_COT','槓桿基金淨持倉','#55bdb5','口','週','CFTC Traders in Financial Futures','https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm','Nasdaq-100 Consolidated（代碼 20974+）槓桿基金多單－空單'), market('NDX','Nasdaq 100','#34444d')] },
  { id: 'breadth', number: 19, group: '市場風險與籌碼', title: 'S&P 500 市場廣度', takeaway: '指數上漲若只有少數股票支撐，廣度會先顯示背離。', explanation: '統計成分股高於 50 日與 200 日均線的比例，分別看中短期與長期參與度。', caution: '使用當期公開成分股回算，因此歷史段有存活者偏誤；15%／85% 僅標示情境，不是買賣線。', series: [publicSeries('SPX_ABOVE_50','高於 50 日均線比率','#55bdb5','%','日','Stocktools 計算／公開 S&P 500 名單／Yahoo Finance','https://github.com/datasets/s-and-p-500-companies','有效成分股中，收盤價高於 50 日均線的比例'), publicSeries('SPX_ABOVE_200','高於 200 日均線比率','#c97755','%','日','Stocktools 計算／公開 S&P 500 名單／Yahoo Finance','https://github.com/datasets/s-and-p-500-companies','有效成分股中，收盤價高於 200 日均線的比例'), fred('SP500','S&P 500','#34444d','指數','日')] },
  { id: 'sectors', number: 20, group: '市場風險與籌碼', title: '美股產業相對強弱', takeaway: '用產業 ETF／VTI 比率，看資金偏好正往哪些產業移動。', explanation: 'VOX、VCR、VDC、VDE、VFH、VHT、VIS、VAW、VNQ、VGT、VPU 分別除以 VTI；比率上升表示跑贏全市場。', caution: 'ETF 成立日與分類調整不同；比率不含個別公司的基本面判斷。', series: ['VOX','VCR','VDC','VDE','VFH','VHT','VIS','VAW','VNQ','VGT','VPU'].map((id, i) => market(`${id}_VTI`,`${id}／VTI`,['#55bdb5','#c97855','#d7b85e','#587d6e','#8aa28c','#a16d64','#6d92aa','#a88f64','#8a76a2','#447d72','#87934f'][i],'比率')) },
];

export const macroGroups = ['景氣與需求', '通膨與利率', '市場風險與籌碼'] as const;
