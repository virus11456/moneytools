import { financialReview } from './dataQuality';
export function FinancialReview({ stock }: { stock: any }) {
  const review = financialReview(stock);
  if (!review) return null;
  return (
    <details className="panel financial-review">
      <summary>財報口徑待核對 · 尚未補值</summary>
      <p>{review.reason}</p>
      <p className="footnote">
        適用財報期 {review.period} · 核對日期 {review.reviewedAt}
        。此說明不代表數值已補齊，也不改變篩選門檻。
      </p>
      <a href={review.url} target="_blank" rel="noreferrer">
        查看公司原始財報 ↗
      </a>
    </details>
  );
}
