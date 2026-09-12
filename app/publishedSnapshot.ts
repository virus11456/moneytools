export function validateSnapshot(value: any) {
  if (
    !value ||
    !Number.isFinite(Date.parse(value.generatedAt)) ||
    !Array.isArray(value.stocks) ||
    !value.stocks.length ||
    !Array.isArray(value.universe) ||
    !Array.isArray(value.errors) ||
    !value.stocks.every(
      (s: any) =>
        typeof s.symbol === 'string' &&
        s.technical &&
        s.fundamentals &&
        s.financials &&
        s.entry,
    )
  ) {
    throw Error('更新資料不完整，保留已載入的版本。');
  }
  return value;
}
export function comparePublication(
  current: { generatedAt: string } | null,
  incoming: { generatedAt: string },
) {
  if (!current) return 'new';
  const difference =
    Date.parse(incoming.generatedAt) - Date.parse(current.generatedAt);
  if (difference < 0) throw Error('來源回傳較舊資料，保留目前版本。');
  return difference === 0 ? 'same' : 'new';
}
