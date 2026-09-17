import { useEffect, useState } from 'react';
import calendars from './calendars/trading-sessions.json';
import { countdown, tradingStatus } from './tradingStatus';
import './market-status.css';

export function MarketStatus({ market }: { market: 'US' | 'TW' }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  const calendar = calendars[market];
  const status = tradingStatus(calendar, now);
  const name = market === 'US' ? '美股' : '台股';
  const time = (value: number) =>
    new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(value);
  return (
    <div className={`market-status market-status--${status.state}`}>
      <div className="market-status-main">
        <span className="market-status-light" aria-hidden="true" />
        <strong>
          {name} ·{' '}
          {status.state === 'open'
            ? '盤中'
            : status.state === 'closed'
              ? '未開盤'
              : '時段待確認'}
        </strong>
        {status.state === 'closed' && (
          <span className="market-status-countdown">
            距開盤 <b>{countdown(status.nextOpenAt - now)}</b>
          </span>
        )}
        {status.state === 'open' && (
          <span className="market-status-countdown">
            距收盤 <b>{countdown(status.closeAt - now)}</b>
          </span>
        )}
      </div>
      <details className="market-status-details">
        <summary>一般交易時段 · 更新說明</summary>
        <div className="market-status-info">
          <p>
            {status.state === 'closed'
              ? `下次開盤：${time(status.nextOpenAt)}（台北時間）`
              : status.state === 'open'
                ? `預定收盤：${time(status.closeAt)}（台北時間）`
                : '交易日曆尚待更新，暫不顯示倒數。'}
          </p>
          <p>
            {market === 'US'
              ? '每日資料：NYSE 收盤後 75 分鐘啟動更新。'
              : '每日資料：台北 16:30–22:30 每小時檢查，官方行情更新後才重新分析。'}
          </p>
          <p>
            依交易日曆計算，非即時報價；不含盤前、盤後交易，臨時停市以交易所公告為準。
          </p>
          <a href={calendar.source} target="_blank" rel="noreferrer">
            交易所日曆 ↗
          </a>
          {market === 'US' && (
            <a href="/tw/us-market-hours">開盤時間與休市日曆</a>
          )}
          <span className="market-status-validity">
            已核對至 {calendar.throughDate}
          </span>
        </div>
      </details>
    </div>
  );
}
