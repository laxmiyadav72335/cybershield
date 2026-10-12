/**
 * MODULE 5 — Password Leak Checker (100% client-side).
 *
 * k-ANONYMITY (Have I Been Pwned "range" API):
 *   1. SHA-1 the password locally → 40 hex chars, e.g. 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
 *   2. Send ONLY the first 5 chars ("5BAA6") to api.pwnedpasswords.com/range/5BAA6
 *   3. The API returns ~800 suffixes that share that prefix, with breach counts
 *   4. We look for OUR suffix in that list locally.
 *   The server never learns the password or even the full hash — 5 hex chars
 *   match ~1 in a million hashes, so it cannot tell which one we meant.
 *   "Add-Padding: true" makes every response the same size so even the
 *   response length leaks nothing.
 */
import { sha1HexUpper } from './hash';
import { scorePassword } from './localScore';

const HIBP_RANGE = 'https://api.pwnedpasswords.com/range/';

export async function checkPwned(password, signal) {
  const hash = await sha1HexUpper(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  let res;
  try {
    res = await fetch(HIBP_RANGE + prefix, { headers: { 'Add-Padding': 'true' }, signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    return { available: false, reason: 'network', prefix, breachCount: 0, candidates: 0 };
  }
  if (!res.ok) return { available: false, reason: `http_${res.status}`, prefix, breachCount: 0, candidates: 0 };
  const body = await res.text();
  let breachCount = 0;
  let candidates = 0;
  for (const line of body.split('\n')) {
    const [sfx, count] = line.trim().split(':');
    if (!sfx) continue;
    const n = Number(count) || 0;
    if (n > 0) candidates++; // padded entries have count 0
    if (sfx === suffix) breachCount = n;
  }
  return { available: true, prefix, breachCount, candidates };
}

/* ─── Local strength estimate (zxcvbn-lite) ─────────────────────────── */
const COMMON = ['password', 'passw0rd', '123456', '12345678', '123456789', 'qwerty', 'abc123', 'letmein', 'welcome', 'admin', 'iloveyou', 'monkey', 'dragon', 'sunshine', 'princess', 'football', 'india123', 'india', 'pass123', 'login', 'master', 'hello', 'freedom', 'whatever', 'qazwsx', 'trustno1', 'zaq12wsx', '1q2w3e4r', 'asdfgh', 'zxcvbn', '111111', '000000', '654321', '112233', 'secret', 'cricket', 'sachin', 'krishna', 'ganesh', 'bharat', 'mumbai', 'delhi', 'jaihind', 'salman', 'shahrukh'];
const SEQUENCES = ['abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '0123456789', '9876543210'];

const humanTime = (seconds) => {
  if (seconds < 1) return 'instantly';
  const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]];
  for (const [name, s] of units) {
    if (seconds >= s) {
      const v = seconds / s;
      if (v > 1e9) return 'centuries';
      return `${Math.round(v).toLocaleString('en-IN')} ${name}${Math.round(v) === 1 ? '' : 's'}`;
    }
  }
  return 'instantly';
};

export function estimateStrength(pw) {
  const suggestions = [];
  const warnings = [];
  if (!pw) return { score: 0, label: 'Very weak', entropyBits: 0, crackTime: 'instantly', suggestions: ['Type a password to see its strength.'], warnings, classes: {} };

  const classes = { lower: /[a-z]/.test(pw), upper: /[A-Z]/.test(pw), digit: /\d/.test(pw), symbol: /[^A-Za-z0-9]/.test(pw) };
  let charset = 0;
  if (classes.lower) charset += 26;
  if (classes.upper) charset += 26;
  if (classes.digit) charset += 10;
  if (classes.symbol) charset += 33;
  let entropy = pw.length * Math.log2(charset || 1);

  const lower = pw.toLowerCase();
  // De-leet: P@ssw0rd → password, so substitutions don't hide a dictionary word
  const deleet = lower.replace(/@/g, 'a').replace(/0/g, 'o').replace(/1|!/g, 'i').replace(/3/g, 'e').replace(/\$|5/g, 's').replace(/7/g, 't').replace(/4/g, 'a');
  const exact = COMMON.some((c) => lower === c || deleet === c || lower.replace(/[^a-z0-9]/g, '') === c || deleet.replace(/[^a-z0-9]/g, '') === c);
  const containedWord = COMMON.find((c) => c.length >= 5 && (lower.includes(c) || deleet.includes(c)));
  if (exact) { entropy = Math.min(entropy, 10); warnings.push('This is one of the most common passwords in the world.'); }
  else if (containedWord) {
    // A common word that makes up most of the password leaves little to guess (Password1, iloveyou2)
    const share = containedWord.length / pw.length;
    entropy = share >= 0.6 ? Math.min(entropy, 20) : entropy - 12;
    warnings.push('Contains a very common word.');
  }
  // Few distinct characters (aaaaaaaa, xyxyxyxy) are trivial regardless of length
  const unique = new Set(pw).size;
  const uniqueCap = unique * Math.log2(charset || 1) + Math.log2(pw.length) * 2;
  if (uniqueCap < entropy) entropy = uniqueCap;
  if (SEQUENCES.some((s) => { for (let i = 0; i + 4 <= lower.length; i++) if (s.includes(lower.slice(i, i + 4))) return true; return false; })) { entropy -= 10; warnings.push('Contains a keyboard or alphabet sequence (e.g. "1234", "qwer").'); }
  if (/(.)\1{2,}/.test(pw)) { entropy -= 8; warnings.push('Repeated characters ("aaa", "111") add almost no strength.'); }
  if (/(19|20)\d\d/.test(pw)) { entropy -= 6; warnings.push('Years are easy to guess — attackers try them first.'); }
  if (/^\d+$/.test(pw)) { entropy = Math.min(entropy, pw.length * 3.3); warnings.push('Digits only — there are very few combinations.'); }
  if (/^[a-z]+$/i.test(pw)) warnings.push('Letters only.');
  entropy = Math.max(0, entropy);

  if (pw.length < 12) suggestions.push('Use at least 12 characters — length matters most.');
  if (!classes.upper || !classes.lower) suggestions.push('Mix UPPER and lower case letters.');
  if (!classes.digit) suggestions.push('Add a number.');
  if (!classes.symbol) suggestions.push('Add a symbol such as ! @ # or _.');
  if (suggestions.length === 0 && entropy < 60) suggestions.push('Try a passphrase: 3–4 random words like "mango-rocket-chai-42".');

  const score = entropy < 28 ? 0 : entropy < 36 ? 1 : entropy < 60 ? 2 : entropy < 80 ? 3 : 4;
  const label = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][score];
  // Offline attack on a fast GPU: ~10 billion SHA-1/NTLM guesses per second
  const crackTime = humanTime(Math.pow(2, entropy) / 1e10);
  return { score, label, entropyBits: Math.round(entropy), crackTime, suggestions, warnings, classes, length: pw.length };
}

/** Build a full report object (same shape as backend reports). NEVER includes the password. */
export async function buildPasswordReport(password, signal) {
  const [hibp, strength] = [await checkPwned(password, signal), estimateStrength(password)];
  const { score, verdict, breakdown } = scorePassword({ breachCount: hibp.breachCount, strength });

  const summary = !hibp.available
    ? `Breach database unreachable — strength is ${strength.label.toLowerCase()}.`
    : hibp.breachCount > 0
      ? `This password has appeared in ${hibp.breachCount.toLocaleString('en-IN')} known data breaches.`
      : `Not found in any known breach. Strength: ${strength.label.toLowerCase()}.`;

  const explanation =
    hibp.breachCount > 0
      ? `Attackers use lists of leaked passwords in automatic "credential stuffing" attacks, and this one is on those lists ${hibp.breachCount.toLocaleString('en-IN')} times. Even if it feels unique to you, it is already known. Change it everywhere you use it, starting with email and banking.`
      : strength.score <= 1
        ? `No breach contains this exact password, but it is ${strength.label.toLowerCase()} and a computer could guess it ${strength.crackTime === 'instantly' ? 'instantly' : `in about ${strength.crackTime}`}. ${strength.suggestions[0] || ''}`
        : `Good news: this password is not in any known breach and would take roughly ${strength.crackTime} to crack offline. Use a unique password for every important account and turn on two-factor authentication.`;

  return {
    scanType: 'password',
    input: null, // never stored
    inputPreview: `${'•'.repeat(Math.min(password.length, 16))} (${password.length} characters)`,
    threatScore: score,
    verdict,
    summary,
    explanation,
    aiAvailable: false,
    breakdown,
    sources: { hibp, strength },
    unavailableSources: hibp.available ? [] : ['Have I Been Pwned'],
    scannedAt: new Date().toISOString(),
    cached: false,
    local: true,
  };
}
