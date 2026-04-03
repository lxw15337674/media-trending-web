/**
 * Generic TTL cache factory for latest snapshot caching.
 */
export function createSnapshotCache<K, V>(defaultTtlMs: number = 5 * 60 * 1000) {
  let cache: {
    expiresAt: number;
    key: K;
    data: V | null;
  } | null = null;

  function clear() {
    cache = null;
  }

  function get(key: K): V | null {
    if (!cache) return null;
    if (Date.now() > cache.expiresAt) return null;
    if (cache.key !== key) return null;
    return cache.data;
  }

  function set(key: K, data: V | null, ttlMs?: number) {
    cache = {
      key,
      data,
      expiresAt: Date.now() + (ttlMs ?? defaultTtlMs),
    };
  }

  return {
    clear,
    get,
    set,
  } as const;
}
