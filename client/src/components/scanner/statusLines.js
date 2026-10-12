/** Cosmetic radar status lines per scanner type. */
export const STATUS_LINES = {
  url: [
    'Normalising link and extracting domain…',
    'Querying Google Safe Browsing…',
    'Checking 70+ antivirus engines on VirusTotal…',
    'Looking up domain registration date (RDAP)…',
    'Running phishing heuristics…',
    'Asking AI to explain the findings…',
  ],
  file: [
    'Computing SHA-256 fingerprint in your browser…',
    'Looking up the hash on VirusTotal…',
    'Uploading for a fresh analysis (only if unknown)…',
    'Waiting for 70+ antivirus engines…',
    'Collecting malware family names…',
    'Asking AI to explain the findings…',
  ],
  message: [
    'Reading the message with Gemini AI…',
    'Matching known Indian scam patterns…',
    'Extracting links from the message…',
    'Scanning each link (Safe Browsing + VirusTotal)…',
    'Highlighting red-flag phrases…',
  ],
  ip: [
    'Validating IPv4 / IPv6 format…',
    'Querying AbuseIPDB reputation (90 days)…',
    'Looking up country, ISP and usage type…',
    'Asking AI to explain the findings…',
  ],
  qr: ['Decoding QR code…', 'Checking the destination…'],
  password: ['Hashing locally (SHA-1)…', 'Querying Have I Been Pwned with 5 characters…'],
};
