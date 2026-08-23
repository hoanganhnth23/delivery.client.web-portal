import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isResourceRequestCancelled,
  readResource,
  releaseResource,
  type ResourceKey,
} from './resourceCache';

interface UseResourceQueryOptions<T> {
  key: ResourceKey;
  enabled?: boolean;
  ttlMs: number;
  fetcher: (signal: AbortSignal) => Promise<T>;
}

export const useResourceQuery = <T>({
  key,
  enabled = true,
  ttlMs,
  fetcher,
}: UseResourceQueryOptions<T>) => {
  const [data, setData] = useState<T | undefined>();
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestVersion = useRef(0);
  const keyRef = useRef(key);
  const serializedKey = JSON.stringify(key);

  useEffect(() => {
    keyRef.current = key;
  }, [key, serializedKey]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const version = requestVersion.current + 1;
    requestVersion.current = version;
    setRefreshing(true);
    setError(null);
    try {
      const value = await readResource(keyRef.current, fetcher, ttlMs);
      if (requestVersion.current === version) setData(value);
    } catch (caught) {
      if (requestVersion.current === version && !isResourceRequestCancelled(caught)) {
        setError(caught instanceof Error ? caught : new Error('Không thể tải dữ liệu'));
      }
    } finally {
      if (requestVersion.current === version) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [enabled, fetcher, ttlMs]);

  useEffect(() => {
    requestVersion.current += 1;
    if (!enabled) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    void refresh();
    return () => {
      releaseResource(keyRef.current);
      requestVersion.current += 1;
    };
  }, [enabled, refresh, serializedKey]);

  return { data, loading, refreshing, error, refresh };
};
