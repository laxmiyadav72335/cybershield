/**
 * Single source of truth for the six scanner modules.
 * Used by: Home scanner cards, Scanner page tabs and Result page labels.
 * Keep IDs stable — they are also the route segment (/scan/:type).
 */
export const SCANNERS = [
  {
    id: 'url',
    label: 'Link',
    title: 'Link Scanner',
    tagline: 'Phishing & malware URLs',
    description:
      'Checks a URL against Google Safe Browsing, 70+ VirusTotal engines, domain age and phishing heuristics.',
    icon: 'link',
    accent: '#22D3EE',
    sources: ['Google Safe Browsing', 'VirusTotal', 'RDAP domain age', 'Heuristics', 'Gemini AI'],
  },
  {
    id: 'file',
    label: 'File',
    title: 'File Scanner',
    tagline: 'Malware in downloads',
    description:
      'Hashes the file in your browser (SHA-256) and looks it up on VirusTotal before uploading anything.',
    icon: 'file',
    accent: '#38BDF8',
    sources: ['SHA-256 hash lookup', 'VirusTotal 70+ engines'],
  },
  {
    id: 'message',
    label: 'SMS / Email',
    title: 'SMS & Email Scam Checker',
    tagline: 'KYC, OTP & job scams',
    description:
      'AI reads the message, flags scam phrases and checks up to three links inside it.',
    icon: 'message',
    accent: '#A78BFA',
    sources: ['Gemini AI analysis', 'Embedded link scan'],
  },
  {
    id: 'qr',
    label: 'QR Code',
    title: 'QR Code Scanner',
    tagline: 'UPI & link QR fraud',
    description:
      'Scan with your camera or upload an image. Decodes URLs and UPI payment requests safely.',
    icon: 'qr',
    accent: '#F472B6',
    sources: ['jsQR decoder', 'Link Scanner', 'UPI parser'],
  },
  {
    id: 'ip',
    label: 'IP Address',
    title: 'IP Address Checker',
    tagline: 'Abuse reputation',
    description:
      'Looks up abuse reports, country, ISP and usage type for any IPv4 / IPv6 address.',
    icon: 'ip',
    accent: '#34D399',
    sources: ['AbuseIPDB'],
  },
  {
    id: 'password',
    label: 'Password',
    title: 'Password Leak Checker',
    tagline: 'Breach exposure',
    description:
      'Uses k-anonymity: only 5 characters of the hash ever leave your browser. Nothing is stored.',
    icon: 'password',
    accent: '#FBBF24',
    sources: ['Have I Been Pwned (k-anonymity)', 'Local strength meter'],
  },
];

export const SCANNER_IDS = SCANNERS.map((s) => s.id);

export const getScanner = (id) => SCANNERS.find((s) => s.id === id);

/** Verdict → colour/label map shared by badges and the gauge. */
export const VERDICTS = {
  safe: { label: 'Safe', color: '#22C55E', text: 'text-safe', bg: 'bg-safe/15', ring: 'ring-safe/40' },
  suspicious: { label: 'Suspicious', color: '#F59E0B', text: 'text-suspicious', bg: 'bg-suspicious/15', ring: 'ring-suspicious/40' },
  dangerous: { label: 'Dangerous', color: '#EF4444', text: 'text-danger', bg: 'bg-danger/15', ring: 'ring-danger/40' },
};

/** Score → verdict mapping (mirrors server/utils/threatScore.js). */
export const verdictFromScore = (score) => {
  if (score <= 30) return 'safe';
  if (score <= 60) return 'suspicious';
  return 'dangerous';
};
