/**
 * ═══════════════════════════════════════════════════════════════════════
 *  THREAT SCORE ENGINE
 *  Every signal has a weight in WEIGHTS below. Scores are capped at 100
 *  and mapped to a verdict with THRESHOLDS. All numbers in one place so
 *  they are easy to explain and tune.
 * ═══════════════════════════════════════════════════════════════════════
 */
export const WEIGHTS = {
  url: {
    SAFE_BROWSING_MATCH: 50,   // Google says it's malware / phishing
    VT_PER_ENGINE: 10,         // each VirusTotal engine flagging it…
    VT_MAX: 40,                // …up to this cap
    YOUNG_DOMAIN: 15,          // registered < YOUNG_DOMAIN_DAYS ago
    YOUNG_DOMAIN_DAYS: 30,
    NO_HTTPS: 5,
    SUSPICIOUS_KEYWORDS: 10,
    // Extra structural heuristics (not in the base spec, kept small)
    IP_ADDRESS_URL: 10,
    EXCESSIVE_SUBDOMAINS: 5,
    AT_SYMBOL_OR_PUNYCODE: 10,
  },
  file: {
    VT_PER_ENGINE: 8,          // file detections are strong evidence
    VT_MAX: 100,
  },
  ip: {
    // AbuseIPDB already returns a 0–100 confidence → used directly
    ABUSE_CONFIDENCE_MULTIPLIER: 1,
    MANY_REPORTS_BONUS: 10,    // > MANY_REPORTS reports in 90 days
    MANY_REPORTS: 20,
  },
  message: {
    // Gemini returns riskScore 0–100 → used directly, plus link findings
    LINK_SCORE_WEIGHT: 0.5,    // worst embedded-link score × this is added
  },
};

export const THRESHOLDS = {
  SAFE_MAX: 30,        // 0–30  → Safe
  SUSPICIOUS_MAX: 60,  // 31–60 → Suspicious, 61–100 → Dangerous
};

export function verdictFromScore(score) {
  if (score <= THRESHOLDS.SAFE_MAX) return 'safe';
  if (score <= THRESHOLDS.SUSPICIOUS_MAX) return 'suspicious';
  return 'dangerous';
}

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Link score. Input = results from the individual services.
 * Returns { score, verdict, breakdown: [{label, points}] } — the breakdown
 * is shown on the Result page so users can see WHY a score was given.
 */
export function scoreUrl({ safeBrowsing, virusTotal, domainAge, heuristics }) {
  const W = WEIGHTS.url;
  const breakdown = [];
  let score = 0;

  if (safeBrowsing?.available && safeBrowsing.matched) {
    score += W.SAFE_BROWSING_MATCH;
    breakdown.push({ label: `Google Safe Browsing: ${safeBrowsing.threats.join(', ')}`, points: W.SAFE_BROWSING_MATCH });
  }

  if (virusTotal?.available && virusTotal.stats) {
    const flagged = (virusTotal.stats.malicious || 0) + (virusTotal.stats.suspicious || 0);
    if (flagged > 0) {
      const pts = Math.min(W.VT_MAX, flagged * W.VT_PER_ENGINE);
      score += pts;
      breakdown.push({ label: `${flagged} VirusTotal engine${flagged > 1 ? 's' : ''} flagged this URL`, points: pts });
    }
  }

  if (domainAge?.available && domainAge.ageDays != null && domainAge.ageDays < W.YOUNG_DOMAIN_DAYS) {
    score += W.YOUNG_DOMAIN;
    breakdown.push({ label: `Domain registered only ${domainAge.ageDays} day${domainAge.ageDays === 1 ? '' : 's'} ago`, points: W.YOUNG_DOMAIN });
  }

  if (heuristics) {
    if (!heuristics.isHttps) {
      score += W.NO_HTTPS;
      breakdown.push({ label: 'Uses HTTP instead of HTTPS', points: W.NO_HTTPS });
    }
    if (heuristics.keywords?.length) {
      score += W.SUSPICIOUS_KEYWORDS;
      breakdown.push({ label: `Suspicious keywords (${heuristics.keywords.slice(0, 3).join(', ')})`, points: W.SUSPICIOUS_KEYWORDS });
    }
    if (heuristics.isIpUrl) {
      score += W.IP_ADDRESS_URL;
      breakdown.push({ label: 'Raw IP address used as the host', points: W.IP_ADDRESS_URL });
    }
    if (heuristics.excessiveSubdomains) {
      score += W.EXCESSIVE_SUBDOMAINS;
      breakdown.push({ label: 'Excessive subdomains', points: W.EXCESSIVE_SUBDOMAINS });
    }
    if (heuristics.hasAtSymbol || heuristics.hasPunycode) {
      score += W.AT_SYMBOL_OR_PUNYCODE;
      breakdown.push({ label: heuristics.hasAtSymbol ? '"@" trick in URL' : 'Punycode look-alike domain', points: W.AT_SYMBOL_OR_PUNYCODE });
    }
  }

  const finalScore = clamp(score);
  return { score: finalScore, verdict: verdictFromScore(finalScore), breakdown };
}

/** File score: VirusTotal detections only (Phase 3). */
export function scoreFile({ virusTotal }) {
  if (!virusTotal?.available || !virusTotal.stats) {
    return { score: null, verdict: 'unknown', breakdown: [] };
  }
  const W = WEIGHTS.file;
  const breakdown = [];
  let score = 0;
  if (virusTotal?.available && virusTotal.stats) {
    const flagged = (virusTotal.stats.malicious || 0) + (virusTotal.stats.suspicious || 0);
    if (flagged > 0) {
      score = Math.min(W.VT_MAX, flagged * W.VT_PER_ENGINE);
      breakdown.push({ label: `${flagged} antivirus engine${flagged > 1 ? 's' : ''} detected malware`, points: score });
    }
  }
  const finalScore = clamp(score);
  return { score: finalScore, verdict: verdictFromScore(finalScore), breakdown };
}

/** IP score: AbuseIPDB confidence + report-volume bonus (Phase 3). */
export function scoreIp({ abuseIpdb }) {
  const W = WEIGHTS.ip;
  const breakdown = [];
  let score = 0;
  if (abuseIpdb?.available) {
    score = (abuseIpdb.abuseConfidenceScore || 0) * W.ABUSE_CONFIDENCE_MULTIPLIER;
    if (score > 0) breakdown.push({ label: `AbuseIPDB confidence ${abuseIpdb.abuseConfidenceScore}%`, points: Math.round(score) });
    if ((abuseIpdb.totalReports || 0) > W.MANY_REPORTS) {
      score += W.MANY_REPORTS_BONUS;
      breakdown.push({ label: `${abuseIpdb.totalReports} abuse reports in 90 days`, points: W.MANY_REPORTS_BONUS });
    }
  }
  const finalScore = clamp(score);
  return { score: finalScore, verdict: verdictFromScore(finalScore), breakdown };
}

/** Message score: Gemini riskScore + half of the worst embedded link score (Phase 3). */
export function scoreMessage({ ai, rules, linkScans = [] }) {
  const W = WEIGHTS.message;
  const breakdown = [];
  let score = 0;
  if (ai?.available) {
    score = ai.riskScore || 0;
    breakdown.push({ label: `${ai.source === 'rules' ? 'Rule-based' : 'AI'} risk assessment (${ai.scamType || 'analysis'})`, points: Math.round(score) });
  }
  if (rules?.available && rules !== ai && rules.riskScore > score) {
    const added = rules.riskScore - score;
    score = rules.riskScore;
    breakdown.push({ label: `Local scam patterns (${rules.scamType || 'analysis'})`, points: Math.round(added) });
  }
  const worstLink = Math.max(0, ...linkScans.map((l) => l.threatScore || 0));
  if (worstLink > 0) {
    const pts = Math.round(worstLink * W.LINK_SCORE_WEIGHT);
    score += pts;
    breakdown.push({ label: `Link inside the message scored ${worstLink}/100`, points: pts });
  }
  const finalScore = clamp(score);
  return { score: finalScore, verdict: verdictFromScore(finalScore), breakdown };
}
