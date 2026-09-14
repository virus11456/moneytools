const object = (v: any) => v !== null && typeof v === 'object' && !Array.isArray(v);
const strings = (v: any) => Array.isArray(v) && v.every((x: any) => typeof x === 'string');
const symbol = (v: any) => typeof v === 'string' && v.trim().length > 0;
export const timestamp = (v: any) => typeof v === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v));
const checks = (v: any) => Array.isArray(v) && v.every((c: any) => object(c) &&
  typeof c.key === 'string' && typeof c.label === 'string' && typeof c.detail === 'string' &&
  ['pass', 'fail', 'missing'].includes(c.status));
export function validStock(s: any) {
  return object(s) && symbol(s.symbol) &&
    ['READY', 'APPROACHING', 'QUALITY', 'WAIT', 'INCOMPLETE'].includes(s.status) &&
    object(s.technical) && object(s.fundamentals) && object(s.financials) && object(s.entry) &&
    typeof s.fundamentals.passed === 'boolean' && typeof s.technical.passed === 'boolean' &&
    checks(s.fundamentals.checks) && checks(s.technical.checks) && checks(s.entry.confirmation) &&
    strings(s.warnings) && strings(s.reasons) && Array.isArray(s.technical.bars) &&
    s.technical.bars.every((b: any) => object(b) && typeof b.date === 'string' &&
      typeof b.close === 'number' && Number.isFinite(b.close) && b.close > 0);
}
function changes(v: any) {
  return Array.isArray(v) && v.every((e: any) => object(e) && symbol(e.symbol) &&
    strings(e.kinds) && strings(e.reasons) &&
    (e.conditionChanges === undefined || (Array.isArray(e.conditionChanges) &&
      e.conditionChanges.every((c: any) => object(c) && typeof c.label === 'string' &&
        object(c.before) && object(c.after)))));
}
export function validateSnapshot(value: any) {
  const reject = () => { throw Error('更新資料不完整，保留已載入的版本。'); };
  if (!object(value) || !timestamp(value.generatedAt) ||
    !Array.isArray(value.stocks) || !value.stocks.length || !value.stocks.every(validStock) ||
    !strings(value.universe) || !value.universe.length || !value.universe.every(symbol) ||
    !Array.isArray(value.errors) || !value.errors.every((e: any) => object(e) && symbol(e.symbol)) ||
    !Number.isInteger(value.coverage) || value.coverage !== value.stocks.length ||
    (value.retainedStocks !== undefined && (!Array.isArray(value.retainedStocks) || !value.retainedStocks.every(validStock))) ||
    (value.dailyChanges !== undefined && !changes(value.dailyChanges)) ||
    (value.changeBaselineSymbols !== undefined && !strings(value.changeBaselineSymbols))) reject();
  // Partial success is valid only when every requested symbol has a result or an error.
  // Never silently deduplicate or discard broken rows, which could change today or coverage.
  const universe = new Set(value.universe);
  const results = new Set(value.stocks.map((s: any) => s.symbol));
  const errors = new Set(value.errors.map((e: any) => e.symbol));
  if (universe.size !== value.universe.length || results.size !== value.stocks.length ||
    errors.size !== value.errors.length || results.size + errors.size !== universe.size ||
    [...results].some(s => !universe.has(s) || errors.has(s)) ||
    [...errors].some(s => !universe.has(s))) reject();
  return value;
}
export function comparePublication(
  current: { generatedAt: string } | null,
  incoming: { generatedAt: string },
) {
  if (!timestamp(incoming?.generatedAt) || (current && !timestamp(current.generatedAt)))
    throw Error('更新時間格式錯誤，保留目前版本。');
  if (!current) return 'new';
  const difference = Date.parse(incoming.generatedAt) - Date.parse(current.generatedAt);
  if (difference < 0) throw Error('來源回傳較舊資料，保留目前版本。');
  return difference === 0 ? 'same' : 'new';
}

export function publicationError(error: unknown, aborted = false): string {
  if (aborted) return '檢查更新逾時，保留已載入資料，稍後會再試。';
  if (error instanceof SyntaxError) return '更新資料格式錯誤，保留已載入的版本。';
  const known = new Set([
    '更新資料不完整，保留已載入的版本。',
    '更新時間格式錯誤，保留目前版本。',
    '來源回傳較舊資料，保留目前版本。',
    '暫時無法檢查更新，保留已載入的資料。',
  ]);
  return error instanceof Error && known.has(error.message)
    ? error.message : '暫時無法讀取更新，保留已載入的資料。';
}
