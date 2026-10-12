/**
 * Keeps the last scan result in sessionStorage so the Result page survives
 * a refresh. Only the report object (never passwords) is stored.
 */
const KEY = 'cybershield:lastResult';

export function saveLastResult(result) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    /* storage may be unavailable (private mode) — ignore */
  }
}

export function loadLastResult() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
