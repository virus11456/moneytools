# 交易時段提示

美股與台股共用 MarketStatus。盤中綠燈與倒數依一般現貨交易時段，每秒以當前裝置時間重算；重新聚焦或回到頁面亦即時校正。不是即時報價或交易所即時營運狀態。盤前盤後不視為盤中，臨時停市以官方公告為準。

2026 日曆來源（2026-09-16 核對）：
- NYSE：https://www.nyse.com/trade/hours-calendars
- TWSE：https://www.twse.com.tw/holidaySchedule/holidaySchedule?response=html

scripts/build_trading_sessions.py 以 ZoneInfo 將交易所當地時間轉 UTC，美股包含夏令時間及11/27、12/24提早收盤；台股包含農曆春節結算不交易日與補假。產物 app/calendars/trading-sessions.json 隨前端打包，不增加Vercel Functions，倒數不需每秒請求後端。

目前已核實範圍為2026。到期或沒有下一個已確認交易日時顯示「時段待確認」，不猜測平日必定開盤。年底前核對下一年正式交易所日曆，更新生成器、重新產生JSON並跑 tests/trading-status.test.mjs；臨時休市需核對交易所公告後修正日曆。本提示與每日掃描排程相互獨立，不變更篩選或資料生成時間。

給台灣使用者的獨立說明頁 `/tw/us-market-hours` 另外維護 NYSE 全日休市與提早收盤表（`app/calendars/nyse-holidays.ts`，來源 NYSE Holidays & Trading Hours，2026–2028）。該頁用同一份名單計算現金股票現在是否開盤，並同時標台北與美東時間；盤前盤後不算開盤。更新休市表後請跑 `tests/us-market-hours.test.mjs`。
