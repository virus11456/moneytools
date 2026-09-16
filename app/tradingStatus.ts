export type TradingCalendar = {
  timeZone: string;
  fromDate: string;
  throughDate: string;
  sessions: string[][];
};
export function tradingStatus(calendar: TradingCalendar | null, now: number) {
  if (!calendar || !Number.isFinite(now)) return { state: 'unknown' as const };
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: calendar.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  if (date < calendar.fromDate || date > calendar.throughDate)
    return { state: 'unknown' as const };
  for (const [openAt, closeAt] of calendar.sessions) {
    const open = Date.parse(openAt), close = Date.parse(closeAt);
    if (now >= open && now < close) return { state: 'open' as const, closeAt: close };
    if (now < open) return { state: 'closed' as const, nextOpenAt: open };
  }
  return { state: 'unknown' as const };
}
export function countdown(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(seconds / 86400);
  const clock = [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60]
    .map(n => String(n).padStart(2, '0')).join(':');
  return `${days ? `${days} 天 ` : ''}${clock}`;
}
