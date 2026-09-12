import { useEffect, useState } from 'react';
const KEY = 'moneytools.saved-symbols.v1';
function readSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    if (
      !Array.isArray(value) ||
      !value.every(
        (s) => typeof s === 'string' && /^[A-Z]{1,6}(?:-[A-Z])?$/.test(s),
      )
    )
      throw Error();
    return { symbols: [...new Set(value as string[])], error: '' };
  } catch {
    return {
      symbols: [] as string[],
      error: '無法讀取此瀏覽器的收藏，仍可正常查詢股票。',
    };
  }
}
export function useSavedStocks() {
  const [state, setState] = useState(readSaved);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null) setState(readSaved());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function toggle(symbol: string) {
    const symbols = state.symbols.includes(symbol)
      ? state.symbols.filter((s) => s !== symbol)
      : [...state.symbols, symbol];
    try {
      localStorage.setItem(KEY, JSON.stringify(symbols));
      setState({ symbols, error: '' });
    } catch {
      setState({
        symbols,
        error: '瀏覽器無法儲存收藏；本次仍可使用，重新整理後可能無法保留。',
      });
    }
  }
  return { saved: state.symbols, storageError: state.error, toggle };
}
