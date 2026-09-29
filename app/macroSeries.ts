import type { MacroPoint } from './macroDashboard';

// Thresholds match gap_limit_days() in scripts/build_us_macro.py.
export function gapLimitDays(points: { date: string }[]): number | null {
  if (points.length < 3) return null;
  const deltas = [];
  for (let index = 1; index < points.length; index += 1) {
    deltas.push(daySpan(points[index - 1].date, points[index].date));
  }
  deltas.sort((a, b) => a - b);
  const median = deltas[Math.floor(deltas.length / 2)];
  if (median <= 5) return 11;
  if (median <= 12) return 12;
  if (median <= 40) return 50;
  return Math.max(Math.floor(median * 1.5), median + 1);
}

function daySpan(start: string, end: string) {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000);
}

export function linePoints(points: MacroPoint[]) {
  const limit = gapLimitDays(points);
  const output: { date: number; value: number | null }[] = [];
  points.forEach((point, index) => {
    if (index > 0 && limit != null && daySpan(points[index - 1].date, point.date) > limit) {
      const broken = Date.parse(`${points[index - 1].date}T00:00:00Z`) + 86400000;
      output.push({ date: broken, value: null });
    }
    output.push({ date: Date.parse(`${point.date}T00:00:00Z`), value: point.value });
  });
  return output;
}
