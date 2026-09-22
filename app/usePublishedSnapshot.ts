import { useCallback, useEffect, useRef, useState } from 'react';
import { comparePublication, validateSnapshot, publicationError } from './publishedSnapshot';
export function usePublishedSnapshot<T extends { generatedAt: string }>() {
  const [snapshot, setSnapshot] = useState<T | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [checkedAt, setCheckedAt] = useState<string>();
  const [updateMessage, setUpdateMessage] = useState('');
  const current = useRef<T | null>(null);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const refresh = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setRefreshing(true);
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      let response = await fetch('/data/dashboard.json', {
        cache: 'no-cache',
        signal: controller.signal,
      });
      // Development and older deployments may only provide the full snapshot.
      if (response.status === 404) response = await fetch('/data/daily.json', {
        cache: 'no-cache', signal: controller.signal,
      });
      if (!response.ok) throw Error('暫時無法檢查更新，保留已載入的資料。');
      const incoming = validateSnapshot(await response.json()) as T;
      if (
        !mounted.current ||
        request.current !== controller ||
        controller.signal.aborted
      )
        return;
      const version = comparePublication(current.current, incoming);
      if (version === 'new') {
        current.current = incoming;
        setSnapshot(incoming);
      }
      setCheckedAt(new Date().toISOString());
      setUpdateMessage(
        version === 'new' ? '已載入最新發布結果' : '已檢查，目前沒有新版本',
      );
      setLoadError('');
    } catch (error: any) {
      if (mounted.current && request.current === controller)
        setLoadError(
          publicationError(error, controller.signal.aborted),
        );
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        if (mounted.current) setRefreshing(false);
      }
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    const checkVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const interval = setInterval(checkVisible, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', checkVisible);
    window.addEventListener('online', checkVisible);
    return () => {
      mounted.current = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', checkVisible);
      window.removeEventListener('online', checkVisible);
      request.current?.abort();
      request.current = null;
    };
  }, [refresh]);
  return { snapshot, refreshing, loadError, checkedAt, updateMessage, refresh };
}
