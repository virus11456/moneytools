type Bar = { date: string; close: number };
export function PriceSparkline({
  symbol,
  bars,
}: {
  symbol: string;
  bars?: Bar[];
}) {
  const recent = (bars || []).slice(-30);
  if (
    recent.length < 2 ||
    recent.some((b) => !Number.isFinite(b.close) || b.close <= 0)
  ) {
    return <span className="spark-unavailable">近期走勢資料不足</span>;
  }
  const first = recent[0];
  const last = recent[recent.length - 1];
  const change = last.close / first.close - 1;
  const prices = recent.map((b) => b.close);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const y = (price: number) =>
    high === low ? 28 : 50 - ((price - low) / (high - low)) * 44;
  const points = recent
    .map((b, i) => `${4 + (i / (recent.length - 1)) * 272},${y(b.close)}`)
    .join(' ');
  const movement = `${change > 0 ? '+' : ''}${(change * 100).toFixed(1)}%`;
  return (
    <figure className={`card-spark ${change >= 0 ? 'rising' : 'falling'}`}>
      <figcaption>
        <span>近 {recent.length} 個交易日</span>
        <strong>{movement}</strong>
      </figcaption>
      <svg
        viewBox="0 0 280 56"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${symbol} ${first.date} 至 ${last.date} 收盤走勢，期間變化 ${movement}。各卡片價格軸獨立縮放。`}
      >
        <line
          x1="4"
          x2="276"
          y1={y(first.close)}
          y2={y(first.close)}
          stroke="#d6dfd0"
          strokeDasharray="3 4"
        />
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx="276" cy={y(last.close)} r="3" fill="currentColor" />
      </svg>
    </figure>
  );
}
