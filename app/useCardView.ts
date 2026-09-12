import { useEffect, useState } from 'react';
const KEY = 'moneytools.card-view.v1';
type CardView = 'compact' | 'expanded';
function read(): CardView {
  try {
    return localStorage.getItem(KEY) === 'compact' ? 'compact' : 'expanded';
  } catch {
    return 'expanded';
  }
}
export function useCardView() {
  const [cardView, setCardView] = useState<CardView>(read);
  const [viewError, setViewError] = useState('');
  function changeView(value: CardView) {
    setCardView(value);
    try {
      localStorage.setItem(KEY, value);
      setViewError('');
    } catch {
      setViewError('本次已切換；瀏覽器無法儲存偏好，重開後可能還原。');
    }
  }
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null) {
        setCardView(read());
        setViewError('');
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return { cardView, changeView, viewError };
}
