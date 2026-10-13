/**
 * Thin fetch wrapper for the CyberShield backend.
 * In local dev VITE_API_BASE_URL is empty and Vite proxies /api → :5001.
 * In production it points at the Render URL.
 */
const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const isForm = body instanceof FormData;
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: isForm ? headers : { 'content-type': 'application/json', ...headers },
      body: isForm || typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the CyberShield server. Is the backend running?', { code: 'network' });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // 502/503/504 come from the dev proxy or a hosting platform when the API itself is down
    if ([502, 503, 504].includes(res.status)) {
      throw new ApiError('Cannot reach the CyberShield server. Is the backend running?', { status: res.status, code: 'network' });
    }
    const msg =
      res.status === 429
        ? data.message || 'You are scanning too fast. Please wait a few minutes and try again.'
        : data.message || `Request failed (${res.status})`;
    throw new ApiError(msg, { status: res.status, code: data.error });
  }
  return data;
}

export const api = {
  health: () => request('/api/health'),
  /** opts.fresh bypasses the server's 1-hour cache (used by "Check again") */
  scanUrl: (url, { fresh, ...opts } = {}) => request(`/api/scan/url${fresh ? '?fresh=1' : ''}`, { method: 'POST', body: { url }, ...opts }),
  scanMessage: (text, opts) => request('/api/scan/message', { method: 'POST', body: { text }, ...opts }),
  scanIp: (ip, opts) => request(`/api/scan/ip?ip=${encodeURIComponent(ip)}`, opts),
  /** body: JSON string (hash-only lookup) or FormData (upload) */
  scanFile: (body, opts) => request('/api/scan/file', { method: 'POST', body, ...opts }),
};
