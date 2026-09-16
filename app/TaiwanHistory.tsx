import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
type Day = {
  scanDate: string;
  counts: Record<string, number>;
  dailyChanges: {
    id: string;
    symbol: string;
    name: string;
    from: string;
    to: string;
  }[];
};
export function TaiwanHistory() {
  const [days, setDays] = useState<Day[] | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function load() {
    if (days || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/data/tw/history.json', { cache: 'no-cache' });
      if (!r.ok) throw Error('暫時無法讀取台股觀察歷史');
      const d = await r.json();
      if (!Array.isArray(d)) throw Error('觀察歷史格式不完整');
      setDays(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : '讀取失敗');
    } finally {
      setBusy(false);
    }
  }
  return (
    <details
      className="tw-panel"
      onToggle={(e) => {
        if (e.currentTarget.open) void load();
      }}
    >
      <summary>
        近 30 日觀察紀錄 <ChevronDown size={16} />
      </summary>
      <p className="tw-muted">
        從台股版本首次發布開始累積，不回填未曾掃描的歷史，也不與美股混用。
      </p>
      {busy && <p role="status">讀取中…</p>}
      {error && (
        <p role="alert">
          {error}{' '}
          <button className="tw-action" onClick={() => void load()}>
            重試
          </button>
        </p>
      )}
      {days
        ?.slice()
        .reverse()
        .map((d) => (
          <div key={d.scanDate} className="tw-history-day">
            <strong>{d.scanDate}</strong>
            <span>
              第一區 {d.counts.DUAL} · 第二區 {d.counts.FUNDAMENTAL}
            </span>
            <span>{d.dailyChanges.length} 筆分類變化</span>
          </div>
        ))}
    </details>
  );
}
