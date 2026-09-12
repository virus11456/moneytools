export type MarketSession = { date: string; closeAt: string; scanAt: string };
export type MarketCalendar = {
  fromDate: string;
  throughDate: string;
  sessions: MarketSession[];
};
export function marketClock(
  calendar: MarketCalendar | null,
  now: number,
  generatedAt?: string,
) {
  const marketDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  if (
    !calendar ||
    marketDate < calendar.fromDate ||
    marketDate > calendar.throughDate
  )
    return null;
  const sessions = calendar.sessions;
  const closed = sessions.filter((s) => Date.parse(s.closeAt) <= now).at(-1);
  const due = sessions.filter((s) => Date.parse(s.scanAt) <= now).at(-1);
  const next = sessions.find((s) => Date.parse(s.scanAt) > now);
  const overdue =
    !!due && (!generatedAt || Date.parse(generatedAt) < Date.parse(due.scanAt));
  const isSessionDay = sessions.some((s) => s.date === marketDate);
  return {
    closed,
    next,
    overdue,
    isSessionDay,
    label: overdue
      ? '已到更新時間 · 等待新掃描結果'
      : !isSessionDay
        ? '美股休市 · 保留最近交易日資料'
        : '依美股收盤時間更新',
  };
}
