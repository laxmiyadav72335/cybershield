/**
 * Google Safe Browsing v4 — threatMatches:find
 * Docs: https://developers.google.com/safe-browsing/v4/lookup-api
 * Returns { available, matched, threats[] } — never throws.
 */
import axios from 'axios';
import { hasKey } from '../utils/config.js';

const ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
const THREAT_TYPES = ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'];

const PRETTY = {
  MALWARE: 'Malware',
  SOCIAL_ENGINEERING: 'Phishing / social engineering',
  UNWANTED_SOFTWARE: 'Unwanted software',
  POTENTIALLY_HARMFUL_APPLICATION: 'Potentially harmful application',
};

export async function checkSafeBrowsing(url) {
  if (!hasKey('SAFE_BROWSING_API_KEY')) {
    return { available: false, reason: 'not_configured', matched: false, threats: [] };
  }
  try {
    const { data } = await axios.post(
      `${ENDPOINT}?key=${process.env.SAFE_BROWSING_API_KEY}`,
      {
        client: { clientId: 'cybershield', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: THREAT_TYPES,
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      },
      { timeout: 8000 },
    );
    const matches = data?.matches || [];
    const threats = [...new Set(matches.map((m) => PRETTY[m.threatType] || m.threatType))];
    return { available: true, matched: threats.length > 0, threats };
  } catch (err) {
    console.warn('[safeBrowsing] failed:', err.response?.status || err.message);
    return { available: false, reason: 'error', matched: false, threats: [] };
  }
}
