// Only accept explicit UTC timestamps emitted by our scanner; never infer a timezone.
function utcMillis(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|\+00:00)$/.test(value)) return null;
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) return null;
  // Date.parse may normalize impossible dates such as February 30.
  if (new Date(milliseconds).toISOString().slice(0, 19) !== value.slice(0, 19)) return null;
  return milliseconds;
}
export function scanDuration(startedAt: unknown, generatedAt: unknown): string | null {
  const start = utcMillis(startedAt), end = utcMillis(generatedAt);
  if (start === null || end === null || end < start) return null;
  const seconds = Math.floor((end - start) / 1000);
  if (seconds < 1) return '少於 1 秒';
  if (seconds < 60) return `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60), rest = seconds % 60;
  if (minutes < 60) return `${minutes} 分${rest ? ` ${rest} 秒` : ''}`;
  const hours = Math.floor(minutes / 60), remaining = minutes % 60;
  return `${hours} 小時${remaining ? ` ${remaining} 分` : ''}`;
}
