/**
 * Client-side threat scoring for the two modules that never touch our backend:
 * QR (UPI / non-URL content) and Password. Mirrors server/utils/threatScore.js
 * in style: every weight lives in one object.
 */
import { verdictFromScore } from '../config/scanners';

export const LOCAL_WEIGHTS = {
  upi: {
    PAYMENT_REQUEST: 30,        // any UPI QR means money leaves YOUR account
    FIXED_AMOUNT: 15,           // pre-filled amount → classic "scan to receive refund" trap
    UNKNOWN_HANDLE: 10,         // payee handle not one of the common PSP suffixes
    SCAM_KEYWORDS: 15,          // name / note mentions refund, prize, kyc, cashback…
    PERSONAL_NAME_WITH_AMOUNT: 10, // looks like a person, not a merchant, asking a fixed sum
  },
  qrOther: { WIFI_OPEN: 20, UNKNOWN_CONTENT: 5 },
  password: {
    BREACHED_BASE: 70,          // seen in at least one breach → Dangerous straight away
    BREACHED_PER_LOG10: 10,     // +10 per order of magnitude of occurrences (cap 30)
    STRENGTH: { 0: 45, 1: 35, 2: 20, 3: 5, 4: 0 }, // not breached: weak passwords still risky
  },
};

const KNOWN_HANDLES = ['okaxis', 'oksbi', 'okhdfcbank', 'okicici', 'ybl', 'ibl', 'axl', 'paytm', 'apl', 'upi', 'sbi', 'hdfcbank', 'icici', 'axisbank', 'kotak', 'yesbank', 'barodampay', 'pnb', 'unionbank', 'indus', 'federal', 'idfcbank', 'airtel', 'freecharge', 'jio', 'ptyes', 'ptsbi', 'pthdfc', 'ptaxis', 'waaxis', 'wahdfcbank', 'waicici', 'wasbi', 'naviaxis', 'slice', 'fam', 'ikwik', 'rapl', 'timecosmos', 'abfspay', 'yapl', 'postbank', 'cnrb', 'boi', 'cbin', 'mahb', 'uco', 'iob', 'kvb', 'dbs', 'hsbc', 'sc', 'citi', 'rbl', 'dlb', 'tjsb', 'bandhan', 'idbi', 'kbl', 'ubi', 'jkb', 'ptys'];
const SCAM_WORDS = /\b(refund|cashback|prize|lottery|reward|kyc|verify|bonus|offer|lucky|winner|claim|receive|credit|loan|customer care|helpline|support)\b/i;

export function scoreUpi(upi) {
  const W = LOCAL_WEIGHTS.upi;
  const breakdown = [];
  let score = W.PAYMENT_REQUEST;
  breakdown.push({ label: 'QR is a UPI payment request (scanning it PAYS someone)', points: W.PAYMENT_REQUEST });

  if (upi.amount != null && upi.amount > 0) {
    score += W.FIXED_AMOUNT;
    breakdown.push({ label: `Pre-filled amount ₹${upi.amount.toLocaleString('en-IN')}`, points: W.FIXED_AMOUNT });
  }
  const handle = (upi.payeeAddress.split('@')[1] || '').toLowerCase();
  if (!handle || !KNOWN_HANDLES.includes(handle)) {
    score += W.UNKNOWN_HANDLE;
    breakdown.push({ label: handle ? `Unusual UPI handle "@${handle}"` : 'Missing or malformed UPI ID', points: W.UNKNOWN_HANDLE });
  }
  if (SCAM_WORDS.test(`${upi.payeeName} ${upi.note}`)) {
    score += W.SCAM_KEYWORDS;
    breakdown.push({ label: 'Scam keywords in payee name / note', points: W.SCAM_KEYWORDS });
  }
  const looksPersonal = upi.payeeName && !upi.merchantCode && /^[a-z]+(\s[a-z]+){0,2}$/i.test(upi.payeeName.trim());
  if (looksPersonal && upi.amount) {
    score += W.PERSONAL_NAME_WITH_AMOUNT;
    breakdown.push({ label: 'Personal name (not a merchant) requesting a fixed amount', points: W.PERSONAL_NAME_WITH_AMOUNT });
  }
  const s = Math.min(100, score);
  return { score: s, verdict: verdictFromScore(s), breakdown };
}

export function scoreOtherQr(parsed) {
  const W = LOCAL_WEIGHTS.qrOther;
  const breakdown = [];
  let score = 0;
  if (parsed.kind === 'wifi' && /nopass/i.test(parsed.wifi.security)) {
    score += W.WIFI_OPEN;
    breakdown.push({ label: 'Open Wi-Fi network (no password) — traffic can be intercepted', points: W.WIFI_OPEN });
  }
  if (parsed.kind === 'text') {
    score += W.UNKNOWN_CONTENT;
    breakdown.push({ label: 'Free-text QR content (cannot be verified)', points: W.UNKNOWN_CONTENT });
  }
  return { score, verdict: verdictFromScore(score), breakdown };
}

export function scorePassword({ breachCount, strength }) {
  const W = LOCAL_WEIGHTS.password;
  const breakdown = [];
  let score = 0;
  if (breachCount > 0) {
    const extra = Math.min(30, Math.floor(Math.log10(breachCount)) * W.BREACHED_PER_LOG10);
    score = W.BREACHED_BASE + extra;
    breakdown.push({ label: `Found in ${breachCount.toLocaleString('en-IN')} data breaches`, points: W.BREACHED_BASE + extra });
  } else {
    const pts = W.STRENGTH[strength.score] ?? 0;
    if (pts) {
      score = pts;
      breakdown.push({ label: `${strength.label} password (easy to guess)`, points: pts });
    }
  }
  const s = Math.min(100, score);
  return { score: s, verdict: verdictFromScore(s), breakdown };
}
