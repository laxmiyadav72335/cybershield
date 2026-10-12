/**
 * Rule-based scam detector for SMS / email text.
 * Used as a FALLBACK when Gemini is not configured (so the demo works
 * offline) and as a second opinion alongside the AI result.
 * Each pattern: regex, points, scam type hint, and a reason shown to the user.
 */
const PATTERNS = [
  { re: /\b(kyc|know your customer)\b/i, pts: 20, type: 'KYC fraud', reason: 'Banks never ask you to "update KYC" through a link in a message.' },
  // Only flag OTP when the message ASKS for it — genuine OTP deliveries say "do not share"
  { re: /(?<!\b(?:not|never|don'?t|dont|mat|nahi|kabhi)\s)\b(share|send|tell|provide|enter|confirm|verify|reply with|batayein|bataye|bhejein|bhejo|dein)\b[^.]{0,40}\b(otp|one[- ]time password|verification code|pin)\b|\b(otp|pin)\b[^.]{0,30}\b(?<!\b(?:not|never|don'?t|mat|nahi|kabhi)\s)(share|send|tell|provide|batayein|bataye|bhejein|bhejo|dein)\b/i, pts: 20, type: 'OTP scam', reason: 'No bank, company or government office will ever ask for your OTP or PIN.' },
  { re: /\b(cyber ?cell|cyber ?crime|cbi|narcotics|ncb|customs|police|court|rbi)\b[\s\S]{0,120}\b(parcel|aadhaar|drugs|illegal|arrest|warrant|money laundering|case)\b/i, pts: 30, type: 'Digital arrest', reason: 'Police, CBI or customs never contact you over phone/video about parcels or cases — this is the "digital arrest" scam.' },
  { re: /\b(stay on (the|this) (call|line)|do not (inform|tell|disconnect|share this with)|don'?t (inform|tell|disconnect)|safe account|rbi account|verification account)\b/i, pts: 30, type: 'Digital arrest', reason: 'Isolating you ("do not tell anyone", "stay on the call") and moving money to a "safe account" are hallmarks of digital-arrest fraud.' },
  // Hinglish patterns
  { re: /\b(band|block|bandh|freeze|suspend)\s+(ho|kar)\s*(jayega|jayegi|diya jayega|jaega|jaayega|jayenge)\b/i, pts: 20, type: 'Account-block threat', reason: 'Threatening that your account "band ho jayega" is a pressure tactic.' },
  { re: /\b(turant|abhi|jaldi|aaj hi|24 ghante|aaj raat|fauran)\b/i, pts: 10, type: 'Urgency pressure', reason: 'Words like "turant" / "aaj hi" create artificial urgency.' },
  { re: /\b(jeeta|jeete|jeet gaye|inaam|badhai ho|mubarak|lakh ka|crore ka)\b/i, pts: 20, type: 'Lottery / prize scam', reason: 'You cannot win a prize you never entered — "aapne jeeta hai" is a classic hook.' },
  { re: /\b(fee|shulk|charge|paise|rupaye|rs\.?\s*\d+)\b[^.]{0,40}\b(bhejein|bhejo|bhej do|jama karein|jama karo|pay karein|pay karo|transfer karein)\b/i, pts: 20, type: 'Advance-fee scam', reason: 'Asking you to send money first ("paise bhejein") to receive something is a scam pattern.' },
  { re: /\b(kyc|khata|account|sim|aadhaar|pan)\b[^.]{0,30}\b(update|verify|link)\s*(karein|karo|kare|karna|kijiye)\b/i, pts: 20, type: 'KYC fraud', reason: 'Banks never ask you to "KYC update karein" through a message link.' },
  { re: /\b(click|tap|open)\s*(karein|karo|kare|kijiye)\b|\blink\s*(par|pe)\s*(click|tap)/i, pts: 10, type: 'Phishing link', reason: 'Scam messages push you to click a link instead of using the official app.' },
  { re: /\b(account|a\/c|card|sim|number|service|electricity|power|connection)\s+(will be|is|has been|gets?)\s+(blocked|suspended|deactivated|disconnected|closed|terminated)/i, pts: 20, type: 'Account-block threat', reason: 'Threatening to block your account creates panic so you act without thinking.' },
  { re: /\b(today|tonight|within \d+ (hours?|hrs|minutes?)|immediately|urgent(ly)?|last (chance|day|warning)|expir(es|ing) (today|soon))\b/i, pts: 10, type: 'Urgency pressure', reason: 'Artificial urgency is a classic pressure tactic.' },
  { re: /\b(won|winner|lottery|lucky draw|prize|jackpot|reward|congratulations)\b/i, pts: 20, type: 'Lottery / prize scam', reason: 'You cannot win a lottery you never entered.' },
  { re: /\b(work from home|part[- ]time job|earn|daily income|per day|salary of|job offer|hiring|registration fee)\b/i, pts: 15, type: 'Fake job offer', reason: 'Genuine employers never ask for fees or promise easy daily income.' },
  { re: /\b(pay|deposit|transfer|send)\b.{0,30}\b(fee|charge|advance|token|security amount|processing)\b/i, pts: 20, type: 'Advance-fee scam', reason: 'Asking you to pay first to receive money or a job is a scam pattern.' },
  { re: /\b(click|tap|open|visit)\b.{0,20}\b(link|below|here|url)\b/i, pts: 10, type: 'Phishing link', reason: 'Scam messages push you to click a link instead of using the official app.' },
  { re: /\b(upi|paytm|phonepe|gpay|google pay|bhim)\b/i, pts: 5, type: 'UPI fraud', reason: 'Payment-app names are used to make the message look legitimate.' },
  { re: /\b(scan|qr code)\b.{0,30}\b(receive|get|collect)\b/i, pts: 25, type: 'QR "receive money" scam', reason: 'You NEVER need to scan a QR code or enter a PIN to receive money.' },
  { re: /\b(dear (customer|user|valued customer|sir\/madam))\b/i, pts: 5, type: 'Generic greeting', reason: 'Real senders usually address you by name.' },
  { re: /\b(income tax|it refund|tax refund|pan card|aadhaar|aadhar)\b/i, pts: 10, type: 'Government impersonation', reason: 'Government departments do not send refund or Aadhaar links by SMS.' },
  { re: /\b(customs|parcel|courier|shipment|package)\b.{0,40}\b(held|stuck|pending|fee|duty)\b/i, pts: 20, type: 'Courier / customs scam', reason: 'Fake parcel-fee messages are a common delivery scam.' },
  { re: /\b(loan|credit)\b.{0,30}\b(approved|pre-approved|instant|without documents)\b/i, pts: 15, type: 'Instant loan scam', reason: 'Instant loans with no documents usually lead to illegal loan apps.' },
  { re: /(bit\.ly|tinyurl|cutt\.ly|t\.co|rb\.gy|shorturl|is\.gd)\//i, pts: 10, type: 'Shortened link', reason: 'Shortened links hide the real destination.' },
  { re: /\b(whatsapp|telegram)\b.{0,30}\b(\+?\d[\d\s-]{8,})/i, pts: 10, type: 'Off-platform contact', reason: 'Moving you to WhatsApp/Telegram avoids spam filters and records.' },
];

export function analyzeMessageHeuristics(text) {
  const redFlags = [];
  const types = new Map();
  let score = 0;
  for (const p of PATTERNS) {
    const m = text.match(p.re);
    if (!m) continue;
    score += p.pts;
    redFlags.push({ phrase: m[0].trim(), reason: p.reason });
    types.set(p.type, (types.get(p.type) || 0) + p.pts);
  }
  if (/[A-Z]{6,}/.test(text) && text.length > 40) {
    score += 5;
    redFlags.push({ phrase: text.match(/[A-Z]{6,}/)[0], reason: 'ALL-CAPS shouting is common in scam messages.' });
  }
  const riskScore = Math.min(100, score);
  const scamType = [...types.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
  const verdict = riskScore <= 30 ? 'safe' : riskScore <= 60 ? 'suspicious' : 'scam';
  return { available: true, source: 'rules', verdict, riskScore, scamType, redFlags, explanation: '', advice: '' };
}
