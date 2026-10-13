import { isValidIp } from './ipValidation.js';

/** Match the API's supported HTTP(S) URLs, including bare domains and IPv6 hosts. */
export function isValidHttpUrl(raw) {
  const value = raw.trim();
  if (!value || value.length > 2048) return false;
  const input = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const u = new URL(input);
    return ['http:', 'https:'].includes(u.protocol)
      && (u.hostname.includes('.') || isValidIp(u.hostname.replace(/^\[|\]$/g, '')));
  } catch {
    return false;
  }
}
