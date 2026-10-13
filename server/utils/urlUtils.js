/**
 * URL parsing + phishing heuristics for the Link Scanner.
 * Pure functions — easy to unit test and explain.
 */

/** Words that commonly appear in phishing / scam URLs (esp. Indian banking scams). */
export const SUSPICIOUS_KEYWORDS = [
  'kyc', 'verify', 'verification', 'login', 'signin', 'update', 'secure', 'account',
  'free', 'reward', 'prize', 'winner', 'lottery', 'gift', 'bonus', 'offer', 'claim',
  'otp', 'password', 'unlock', 'suspend', 'confirm', 'urgent', 'refund', 'cashback',
  'sbi', 'hdfc', 'icici', 'axis', 'pnb', 'paytm', 'phonepe', 'gpay', 'upi', 'netbanking',
  'aadhaar', 'pan-card', 'pancard', 'irctc', 'electricity', 'bill-pay',
];

/** Accept "example.com", "http://x", "https://x" → always returns a URL object or null. */
export function normalizeUrl(raw) {
  if (typeof raw !== 'string') return null;
  let input = raw.trim();
  if (!input || input.length > 2048) return null;
  // No scheme typed (e.g. "example.com") → assume https so the user is not penalised for our guess
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(input)) input = `https://${input}`;
  try {
    const u = new URL(input);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    if (!u.hostname || !u.hostname.includes('.') && !isIpAddress(u.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

export function isIpAddress(host) {
  const h = host.replace(/^\[|\]$/g, '');
  const v4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
  const v6 = /^[0-9a-f:]+$/i;
  return v4.test(h) || (h.includes(':') && v6.test(h));
}

/**
 * Registrable domain (eTLD+1) approximation.
 * Handles common two-level public suffixes like co.in, co.uk, com.au.
 */
const TWO_LEVEL_TLDS = new Set(['co.in', 'co.uk', 'com.au', 'co.nz', 'org.in', 'net.in', 'ac.in', 'gov.in', 'com.br', 'co.jp', 'co.za']);
export function getRegistrableDomain(hostname) {
  const parts = hostname.toLowerCase().split('.');
  if (parts.length <= 2) return hostname.toLowerCase();
  const lastTwo = parts.slice(-2).join('.');
  return TWO_LEVEL_TLDS.has(lastTwo) ? parts.slice(-3).join('.') : lastTwo;
}

/**
 * Heuristic checks on the URL string itself (no network).
 * Returns booleans + human-readable flags used by the score engine and UI.
 */
export function analyzeUrlHeuristics(u) {
  const hostname = u.hostname.toLowerCase();
  const full = `${hostname}${u.pathname}${u.search}`.toLowerCase();
  const isHttps = u.protocol === 'https:';
  const isIpUrl = isIpAddress(hostname);
  const subdomainCount = isIpUrl ? 0 : Math.max(0, hostname.split('.').length - 2);
  const excessiveSubdomains = subdomainCount >= 3;
  const keywords = SUSPICIOUS_KEYWORDS.filter((k) => full.includes(k));
  // Only userinfo before the host can disguise the real destination. An @ in
  // a query value (for example an email address) does not change the host.
  const hasAtSymbol = Boolean(u.username || u.password);
  const isVeryLong = u.href.length > 100;
  const hasPunycode = hostname.includes('xn--');

  const flags = [];
  if (!isHttps) flags.push({ severity: 'warn', label: 'No HTTPS', detail: 'Data sent to this site is not encrypted.' });
  if (isIpUrl) flags.push({ severity: 'warn', label: 'IP address instead of domain', detail: 'Legitimate services almost never use raw IP addresses in links.' });
  if (excessiveSubdomains) flags.push({ severity: 'warn', label: 'Too many subdomains', detail: `${subdomainCount} subdomains — a common trick to hide the real domain.` });
  if (keywords.length) flags.push({ severity: 'warn', label: 'Suspicious keywords', detail: `Contains: ${keywords.slice(0, 6).join(', ')}` });
  if (hasAtSymbol) flags.push({ severity: 'warn', label: '"@" in URL', detail: 'Everything before "@" is ignored by the browser — used to disguise the real host.' });
  if (hasPunycode) flags.push({ severity: 'warn', label: 'Punycode domain', detail: 'Uses look-alike international characters (homograph attack risk).' });
  if (isVeryLong) flags.push({ severity: 'info', label: 'Very long URL', detail: 'Long URLs are often used to hide the destination.' });
  if (isHttps && flags.length === 0) flags.push({ severity: 'ok', label: 'No structural red flags', detail: 'HTTPS, normal domain structure, no scam keywords.' });

  return { isHttps, isIpUrl, subdomainCount, excessiveSubdomains, keywords, hasAtSymbol, hasPunycode, isVeryLong, flags };
}

/** Extract http(s) URLs from free text (used by the SMS/Email module). */
export function extractUrls(text) {
  // 1) explicit http(s):// or www.   2) bare domains like bit.ly/abc or sbi-kyc.xyz/claim
  const re = /(?<![@\w.-])((?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|net|org|co|io|xyz|top|club|info|site|online|link|me|ly|app|shop|tk|ml|ga|cf|gq|buzz)\b(?:\/[^\s<>"']*)?)/gi;
  const found = text.match(re) || [];
  return [...new Set(found.map((s) => s.replace(/[.,;:!?)]+$/, '')))].slice(0, 5);
}
