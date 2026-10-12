/**
 * AbuseIPDB v2 — /check
 * Docs: https://docs.abuseipdb.com/#check-endpoint
 * Returns abuseConfidenceScore (0–100), country, ISP, usage type, report counts.
 */
import axios from 'axios';
import { hasKey } from '../utils/config.js';

export async function checkAbuseIpdb(ip) {
  if (!hasKey('ABUSEIPDB_API_KEY')) return { available: false, reason: 'not_configured' };
  try {
    const { data } = await axios.get('https://api.abuseipdb.com/api/v2/check', {
      params: { ipAddress: ip, maxAgeInDays: 90, verbose: '' },
      headers: { Key: process.env.ABUSEIPDB_API_KEY, Accept: 'application/json' },
      timeout: 8000,
    });
    const d = data?.data || {};
    return {
      available: true,
      abuseConfidenceScore: d.abuseConfidenceScore ?? 0,
      countryCode: d.countryCode || null,
      countryName: d.countryName || null,
      isp: d.isp || null,
      domain: d.domain || null,
      usageType: d.usageType || null,
      totalReports: d.totalReports ?? 0,
      numDistinctUsers: d.numDistinctUsers ?? 0,
      lastReportedAt: d.lastReportedAt || null,
      isWhitelisted: Boolean(d.isWhitelisted),
      isTor: Boolean(d.isTor),
      isPublic: d.isPublic !== false,
      recentCategories: [...new Set((d.reports || []).flatMap((r) => r.categories || []))].slice(0, 8),
    };
  } catch (err) {
    const status = err.response?.status;
    console.warn('[abuseIpdb] failed:', status || err.message);
    return { available: false, reason: status === 429 ? 'rate_limited' : 'error' };
  }
}
