import { useState, useEffect, useCallback } from 'react';

export function useApi(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with status ${res.status}`);
      }
      const json = await res.json();
      setData(json.data ?? json);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [url]);

  useEffect(() => { execute(); }, [execute]);

  return { data, loading, error, refetch: execute };
}
