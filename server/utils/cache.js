/**
 * Tiny in-memory TTL cache.
 * Why: the VirusTotal free tier allows ~4 requests/minute, so repeat scans of
 * the same URL / file hash within an hour are served from memory instead.
 * (For multi-instance deployments swap this for Redis — same get/set API.)
 */
const store = new Map();
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

export function cacheGet(key) {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

export function cacheSet(key, value, ttlMs = DEFAULT_TTL_MS) {
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

/** Periodic sweep so the Map doesn't grow forever. */
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) if (now > v.expires) store.delete(k);
}, 10 * 60 * 1000).unref();
