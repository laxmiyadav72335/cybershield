/**
 * Builds a Result-page report for a decoded QR code.
 *  - URL     → the backend Link Scanner report, tagged with QR metadata
 *  - UPI     → local report with parsed payment fields + "receive money" warning
 *  - other   → local report (wifi / phone / text…)
 */
import { api } from '../services/api';
import { parseQrContent } from './qr';
import { scoreUpi, scoreOtherQr } from './localScore';

export async function buildQrReport(rawText, source, signal) {
  const parsed = parseQrContent(rawText);
  const qr = { raw: rawText, kind: parsed.kind, source };

  if (parsed.kind === 'url') {
    const link = await api.scanUrl(parsed.url, { signal });
    return {
      ...link,
      scanType: 'qr',
      qr,
      linkInput: link.input,
      inputPreview: `QR → ${link.inputPreview}`,
      summary: `QR opens a link. ${link.summary}`,
    };
  }

  if (parsed.kind === 'upi') {
    const { score, verdict, breakdown } = scoreUpi(parsed.upi);
    const u = parsed.upi;
    const who = u.payeeName || u.payeeAddress || 'an unknown payee';
    return {
      scanType: 'qr',
      qr,
      input: rawText,
      inputPreview: `UPI payment to ${who}`,
      threatScore: score,
      verdict,
      summary: u.amount ? `This QR asks you to PAY ₹${u.amount.toLocaleString('en-IN')} to ${who}.` : `This QR asks you to PAY ${who} (you type the amount).`,
      explanation:
        'A UPI QR code can only move money OUT of your account — it is a payment request, never a way to receive money. ' +
        (u.amount
          ? 'The amount is already filled in, which is exactly how "scan to get your refund / prize" scams work: the victim scans, enters their PIN, and the money is gone. '
          : '') +
        'Only scan it if you intended to pay this exact person or shop, and check that the payee name on your UPI app matches who you expect.',
      aiAvailable: false,
      breakdown,
      sources: { upi: u },
      unavailableSources: [],
      scannedAt: new Date().toISOString(),
      cached: false,
      local: true,
    };
  }

  const { score, verdict, breakdown } = scoreOtherQr(parsed);
  const labels = { wifi: 'Wi-Fi network', tel: 'Phone number', contact: 'Contact / message', vcard: 'Contact card', text: 'Plain text' };
  return {
    scanType: 'qr',
    qr,
    input: rawText,
    inputPreview: `QR → ${labels[parsed.kind] || 'content'}`,
    threatScore: score,
    verdict,
    summary: `This QR contains a ${(labels[parsed.kind] || 'content').toLowerCase()}, not a link or payment request.`,
    explanation:
      parsed.kind === 'wifi'
        ? `The QR joins the Wi-Fi network "${parsed.wifi.ssid}"${/nopass/i.test(parsed.wifi.security) ? ' which has no password — anyone on it can snoop on unencrypted traffic' : ''}. Only join networks you trust.`
        : parsed.kind === 'tel'
          ? `The QR dials ${parsed.phone}. Scammers sometimes use this to get you to call premium-rate or "customer care" numbers — verify the number on the official website first.`
          : 'This QR holds plain content with nothing to look up. Be cautious if it asks you to install an app, call a number or share a code.',
    aiAvailable: false,
    breakdown,
    sources: { parsed },
    unavailableSources: [],
    scannedAt: new Date().toISOString(),
    cached: false,
    local: true,
  };
}
