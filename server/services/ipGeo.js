/**
 * Free geolocation enrichment via ip-api.com (no key, 45 req/min, non-commercial).
 * Gives country / city / ISP / ASN even when AbuseIPDB is not configured.
 */
import axios from 'axios';
import { cacheGet, cacheSet } from '../utils/cache.js';

export async function geoLookup(ip) {
  const key = `geo:${ip}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  try {
    const { data } = await axios.get(`http://ip-api.com/json/${encodeURIComponent(ip)}`, {
      params: { fields: 'status,message,country,countryCode,regionName,city,lat,lon,isp,org,as,proxy,hosting,mobile' },
      timeout: 6000,
    });
    if (data?.status !== 'success') return cacheSet(key, { available: false, reason: data?.message || 'error' });
    return cacheSet(key, {
      available: true,
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.city,
      lat: data.lat,
      lon: data.lon,
      isp: data.isp,
      org: data.org,
      asn: data.as,
      isProxy: Boolean(data.proxy),
      isHosting: Boolean(data.hosting),
      isMobile: Boolean(data.mobile),
    }, 24 * 60 * 60 * 1000);
  } catch (err) {
    console.warn('[ipGeo] failed:', err.message);
    return { available: false, reason: 'error' };
  }
}
