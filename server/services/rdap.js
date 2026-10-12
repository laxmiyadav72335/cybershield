/**
 * Domain age via RDAP (free, no API key).
 * GET https://rdap.org/domain/{domain} → redirects to the registry's RDAP server.
 * We read the "registration" event date and compute the age in days.
 * Young domains (< 30 days) are a strong phishing indicator because scam
 * sites are created, used and abandoned quickly.
 */
import axios from 'axios';
import { cacheGet, cacheSet } from '../utils/cache.js';

export async function getDomainAge(domain) {
  if (!domain) return { available: false, reason: 'no_domain' };
  const cacheKey = `rdap:${domain}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      timeout: 8000,
      headers: { accept: 'application/rdap+json, application/json' },
      maxRedirects: 5,
    });
    const events = data?.events || [];
    const reg = events.find((e) => e.eventAction === 'registration');
    const exp = events.find((e) => e.eventAction === 'expiration');
    if (!reg?.eventDate) return cacheSet(cacheKey, { available: false, reason: 'no_registration_event', domain });

    const registered = new Date(reg.eventDate);
    const ageDays = Math.max(0, Math.floor((Date.now() - registered.getTime()) / 86_400_000));
    const registrar = data?.entities?.find((e) => e.roles?.includes('registrar'))?.vcardArray?.[1]?.find((v) => v[0] === 'fn')?.[3] || null;

    return cacheSet(cacheKey, {
      available: true,
      domain,
      registered: registered.toISOString(),
      expires: exp?.eventDate || null,
      ageDays,
      isNew: ageDays < 30,
      registrar,
    }, 24 * 60 * 60 * 1000); // domain age changes slowly → cache 24h
  } catch (err) {
    const status = err.response?.status;
    // 404 = TLD not supported by RDAP or domain not registered (itself suspicious for a live link)
    console.warn('[rdap] failed:', status || err.message);
    return { available: false, reason: status === 404 ? 'not_found' : 'error', domain };
  }
}
