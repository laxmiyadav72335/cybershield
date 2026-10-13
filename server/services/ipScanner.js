/**
 * MODULE 6 — IP Address Checker.
 * Validates IPv4/IPv6, queries AbuseIPDB (reputation) and ip-api (geo) in
 * parallel, scores from abuseConfidenceScore, explains.
 */
import { isIP } from 'node:net';
import { checkAbuseIpdb } from './abuseIpdb.js';
import { geoLookup } from './ipGeo.js';
import { explainFindings } from './gemini.js';
import { scoreIp } from '../utils/threatScore.js';
import { cacheGet, cacheSet } from '../utils/cache.js';
import { httpError } from '../middleware/errorHandler.js';

// Private + reserved/documentation/multicast ranges — never routable on the public internet
const PRIVATE_V4 = /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|192\.0\.[02]\.|198\.1[89]\.|198\.51\.100\.|203\.0\.113\.|2(2[4-9]|[3-5]\d)\.|255\.255\.255\.255$)/;

export function isNonPublicIp(ip, version = isIP(ip)) {
  if (version === 4) return PRIVATE_V4.test(ip);
  if (version === 6) return /^(::(?:1)?$|fc|fd|fe[89ab]|ff|2001:db8:)/i.test(ip);
  return false;
}

export function ipReputationSummary(abuseIpdb) {
  if (!abuseIpdb.available) return 'AbuseIPDB reputation could not be checked for this address.';
  const reports = abuseIpdb.totalReports || 0;
  if (reports === 0) return `No abuse reports in the last 90 days${abuseIpdb.isWhitelisted ? ' (whitelisted)' : ''}.`;
  return `${reports} abuse report${reports === 1 ? '' : 's'} from ${abuseIpdb.numDistinctUsers} users — ${abuseIpdb.abuseConfidenceScore}% confidence of abuse${abuseIpdb.isWhitelisted ? ' (whitelisted)' : ''}.`;
}

export async function scanIp(rawIp) {
  let ip = String(rawIp || '').trim().replace(/^\[|\]$/g, '');
  // IPv4-mapped IPv6 (::ffff:1.2.3.4) is really an IPv4 address — look up the v4 form
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) ip = mapped[1];
  const version = isIP(ip);
  if (!version) throw httpError(400, 'invalid_ip', 'Enter a valid IPv4 (e.g. 8.8.8.8) or IPv6 address.');
  const isPrivate = isNonPublicIp(ip, version);

  const cacheKey = `ip:${ip}`;
  const cached = cacheGet(cacheKey);
  if (cached) return { ...cached, cached: true };

  if (isPrivate) {
    const report = {
      scanType: 'ip', input: ip, inputPreview: ip, ipVersion: version, isPrivate,
      threatScore: null, verdict: 'unknown',
      summary: 'This is a local or reserved address. Public reputation and geolocation checks do not apply.',
      explanation: 'This address was not checked by AbuseIPDB or geolocation services. No threat score is available; an unscored address should not be treated as safe.',
      aiAvailable: false, breakdown: [],
      sources: { abuseIpdb: { available: false, reason: 'private' }, geo: { available: false, reason: 'private' } },
      unavailableSources: [], scannedAt: new Date().toISOString(), cached: false,
    };
    cacheSet(cacheKey, report);
    return report;
  }

  const [abuseIpdb, geo] = await Promise.all([checkAbuseIpdb(ip), geoLookup(ip)]);

  if (!abuseIpdb.available) {
    const report = {
      scanType: 'ip', input: ip, inputPreview: ip, ipVersion: version, isPrivate,
      threatScore: null, verdict: 'unknown',
      summary: ipReputationSummary(abuseIpdb),
      explanation: 'The reputation service did not return a result. No threat score is available; an unscored address should not be treated as safe.',
      aiAvailable: false, breakdown: [], sources: { abuseIpdb, geo },
      unavailableSources: ['AbuseIPDB', ...(!geo.available ? ['Geolocation'] : [])],
      scannedAt: new Date().toISOString(), cached: false,
    };
    return report;
  }

  const { score, verdict, breakdown } = scoreIp({ abuseIpdb });

  const ai = await explainFindings({
    scanType: 'ip',
    input: ip,
    verdict,
    score,
    breakdown,
    unavailable: [...(!abuseIpdb.available ? ['AbuseIPDB'] : [])],
    extra: {
      Country: abuseIpdb.countryName || geo.country || 'unknown',
      ISP: abuseIpdb.isp || geo.isp || 'unknown',
      'Usage type': abuseIpdb.usageType || (geo.isHosting ? 'Data Center/Web Hosting' : 'unknown'),
      'Reports (90 days)': abuseIpdb.available ? abuseIpdb.totalReports : 'unknown',
    },
  });

  const report = {
    scanType: 'ip',
    input: ip,
    inputPreview: ip,
    ipVersion: version,
    isPrivate,
    threatScore: score,
    verdict,
    summary: ipReputationSummary(abuseIpdb),
    explanation: ai.text,
    aiAvailable: ai.available,
    breakdown,
    sources: { abuseIpdb, geo },
    unavailableSources: [...(!abuseIpdb.available ? ['AbuseIPDB'] : []), ...(!geo.available ? ['Geolocation'] : [])],
    scannedAt: new Date().toISOString(),
    cached: false,
  };
  cacheSet(cacheKey, report);
  return report;
}
