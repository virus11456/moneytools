# 待發布：條件摘要與門檻差距

分支：batch/condition-progress

包含首頁剩餘條件、個股門檻差距、進場距離與風險報酬差距、邊界測試。尚未合併 main 或上線。

vercel.json 僅停用本分支的自動部署，main 部署維持原設定。

本機 condition-progress.test.mjs 與型別檢查通過。完整本機建置受到 macOS dataless 套件影響，尚未確認完成；需確認 GitHub CI 與手機/iPad UI 後再發布。

每天 Vercel 建置最多 20 次（包括資料更新和重試），須核對額度並集中發布；尚未設定自動硬性限制。合併 main 將觸發正式部署。
