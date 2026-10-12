/** 10-question scam awareness quiz. `answer` is the index of the correct option. */
export const QUIZ = [
  {
    q: 'You receive an SMS: "Your SBI account will be blocked today. Update KYC: http://sbi-kyc.verify-login.xyz". What should you do?',
    options: ['Click the link quickly before the account is blocked', 'Open the official SBI app yourself and check', 'Reply with your account number to confirm', 'Forward it to friends so they can update too'],
    answer: 1,
    why: 'Banks never block accounts over SMS links. Always go to the official app or website yourself; the domain here is not sbi.co.in.',
  },
  {
    q: 'A caller from "Amazon customer care" says a wrong order was placed and asks for the OTP to cancel it. The OTP is…',
    options: ['Safe to share since they want to cancel, not pay', 'The final approval for a payment — sharing it completes the fraud', 'Only useful to Amazon employees', 'Required by law to be shared with customer care'],
    answer: 1,
    why: 'An OTP approves a transaction the scammer has already started. No genuine company ever asks for it.',
  },
  {
    q: 'Someone buying your old phone on OLX sends a QR code and says "scan it and enter your PIN to receive ₹12,000". What happens if you do?',
    options: ['₹12,000 is credited to your account', 'Nothing — QR codes cannot move money', 'Money is debited FROM your account', 'The payment waits for your approval'],
    answer: 2,
    why: 'A UPI QR is a payment request. Scanning + PIN always sends money out. You never need to scan anything to receive money.',
  },
  {
    q: 'Which of these links is most likely genuine for HDFC Bank?',
    options: ['http://hdfc-netbanking-secure.xyz/login', 'https://hdfcbank.verify-kyc.in', 'https://netbanking.hdfcbank.com', 'https://hdfcbank.com.update-account.co'],
    answer: 2,
    why: 'Look at the part just before the first "/" — the real domain. Only "hdfcbank.com" is the official domain; the others put "hdfcbank" inside a different domain.',
  },
  {
    q: 'A WhatsApp message offers ₹3,000/day for liking YouTube videos, but asks for a ₹499 "registration fee". This is…',
    options: ['A normal onboarding charge', 'A fake job / task scam — genuine employers never charge fees', 'Legal if they give a receipt', 'Safe if the first payout arrives'],
    answer: 1,
    why: 'Early small payouts are bait. Any job that asks you to pay first is a scam, even if the first "earnings" are real.',
  },
  {
    q: 'What is the national cyber-fraud helpline number in India?',
    options: ['100', '1930', '112', '1800-11-4000'],
    answer: 1,
    why: '1930 connects to the cyber-crime helpline. Calling quickly can freeze money before it leaves the banking system.',
  },
  {
    q: 'An SMS from a 10-digit mobile number says your electricity will be cut tonight and asks you to call an "officer". The biggest red flag is…',
    options: ['The message is in English', 'It came from a personal mobile number with a night deadline', 'It mentions your city', 'It does not include a link'],
    answer: 1,
    why: 'Official boards use registered sender IDs and send written notices. Personal numbers plus urgent night deadlines are classic scam pressure.',
  },
  {
    q: 'A "police officer" on a video call says a parcel with your Aadhaar contained drugs and you must transfer money to a "safe account" and stay on the call. You should…',
    options: ['Transfer the money to prove innocence', 'Stay on the call as instructed', 'Hang up, tell a family member and call 1930', 'Share your bank details so they can verify'],
    answer: 2,
    why: 'This is "digital arrest". Police never arrest over video calls or ask for money. Disconnect immediately.',
  },
  {
    q: 'Which password is the strongest?',
    options: ['Rahul@1998', 'password123', 'mango-rocket-chai-42', 'Qwerty!23'],
    answer: 2,
    why: 'Length beats complexity. A 4-word passphrase has far more combinations than a short word with a year or symbol, and is not in breach lists.',
  },
  {
    q: 'How does CyberShield check a password without ever sending it anywhere?',
    options: ['It encrypts the password and emails it to the server', 'It sends only the first 5 characters of the password\'s SHA-1 hash (k-anonymity)', 'It compares the password with a list stored on the website', 'It asks Google to check it'],
    answer: 1,
    why: 'k-anonymity: the hash prefix matches about a million possible passwords, so the breach database cannot tell which one you typed. The comparison happens in your browser.',
  },
];
