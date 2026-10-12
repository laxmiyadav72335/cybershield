/**
 * MODULE 1 — Link Scanner orchestrator.
 * Runs all sources in parallel (Promise.allSettled → one failing API never
 * blocks the others), scores the result, asks Gemini for an explanation,
 * and caches the final report for 1 hour.
 */
import { normalizeUrl, getRegistrableDomain, analyzeUrlHeuristics } from '../utils/urlUtils.js';
import { checkSafeBrowsing } from './safeBrowsing.js';
import { scanUrlWithVirusTotal } from './virusTotal.js';
import { getDomainAge } from './rdap.js';
import { explainFindings, fallbackExplanation } from './gemini.js';
import { scoreUrl } from '../utils/threatScore.js';
import { cacheGet, cacheSet } from '../utils/cache.js';
import { httpError } from '../middleware/errorHandler.js';

const settled = (p) => p.then((v) => v).catch((e) => ({ available: false, reason: 'error', error: e.message }));

export async function scanUrl(rawUrl, { skipCache = false, quick = false } = {}) {
  const u = normalizeUrl(rawUrl);
  if (!u) throw httpError(400, 'invalid_url', 'Please enter a valid http:// or https:// link.');
  const url = u.href;

  const cacheKey = `url:${url}`;
  if (!skipCache) {
    const cached = cacheGet(cacheKey);
    if (cached) return { ...cached, cached: true };
  }

  const domain = u.hostname;
  const registrable = getRegistrableDomain(domain);
  const heuristics = analyzeUrlHeuristics(u);

  // All network sources in parallel
  const [safeBrowsing, virusTotal, domainAge] = await Promise.all([
    settled(checkSafeBrowsing(url)),
    settled(scanUrlWithVirusTotal(url, { quick })),
    heuristics.isIpUrl ? Promise.resolve({ available: false, reason: 'ip_url' }) : settled(getDomainAge(registrable)),
  ]);

  const { score, verdict, breakdown } = scoreUrl({ safeBrowsing, virusTotal, domainAge, heuristics });

  // quick mode (links inside a message): skip the AI explanation — the message itself gets one
  const ai = quick
    ? { available: false, text: fallbackExplanation({ scanType: 'url', verdict, score, breakdown }) }
    : await explainFindings({
    scanType: 'url',
    input: url,
    verdict,
    score,
    breakdown,
    unavailable: [...(!safeBrowsing.available ? ['Google Safe Browsing'] : []), ...(!virusTotal.available ? ['VirusTotal'] : [])],
    extra: {
      'Domain age': domainAge.available ? `${domainAge.ageDays} days` : 'unknown',
      'VirusTotal': virusTotal.available && virusTotal.stats ? `${virusTotal.stats.malicious} malicious, ${virusTotal.stats.suspicious} suspicious of ${virusTotal.engines.length} engines` : virusTotal.status,
    },
  });

  const flagged = virusTotal.stats ? virusTotal.stats.malicious + virusTotal.stats.suspicious : 0;
  const summary =
    verdict === 'safe'
      ? breakdown.length
        ? `No threats found, only minor warnings: ${breakdown.map((b) => b.label.toLowerCase()).join('; ')}.`
        : 'No threats found by our security sources.'
      : verdict === 'suspicious'
        ? `Some warning signs: ${breakdown.map((b) => b.label).slice(0, 2).join('; ')}.`
        : safeBrowsing.matched
          ? `Flagged by Google Safe Browsing (${safeBrowsing.threats.join(', ')}).`
          : `Flagged by ${flagged} antivirus engine${flagged === 1 ? '' : 's'}.`;

  const report = {
    scanType: 'url',
    input: url,
    inputPreview: url.length > 80 ? `${url.slice(0, 77)}…` : url,
    domain,
    threatScore: score,
    verdict,
    summary,
    explanation: ai.text,
    aiAvailable: ai.available,
    breakdown,
    sources: { safeBrowsing, virusTotal, domainAge, heuristics },
    unavailableSources: [
      ...(!safeBrowsing.available ? ['Google Safe Browsing'] : []),
      ...(!virusTotal.available || virusTotal.status === 'queued' ? ['VirusTotal'] : []),
      ...(!domainAge.available && domainAge.reason !== 'ip_url' ? ['Domain age'] : []),
    ],
    scannedAt: new Date().toISOString(),
    cached: false,
  };

  // Don't cache "queued" VT results for long — the user will want the full report soon
  cacheSet(cacheKey, report, virusTotal.status === 'queued' || virusTotal.status === 'rate_limited' ? 60 * 1000 : undefined);
  return report;
}
