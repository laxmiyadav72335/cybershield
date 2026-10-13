/**
 * QR helpers (MODULE 4).
 *  decodeImageFile(file)  → decoded string or null (uses jsQR on a canvas)
 *  parseQrContent(text)   → { kind: 'url' | 'upi' | 'wifi' | 'tel' | 'text', ... }
 */
import jsQR from 'jsqr';

const MAX_SIDE = 1600; // downscale huge photos for speed

export function decodeImageData(imageData) {
  // 'attemptBoth' tries the normal image, then the inverted one (white-on-black codes).
  // Note: calling jsQR with 'onlyInvert' directly throws on images without a code,
  // so we always use attemptBoth in a single call.
  try {
    return jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
  } catch {
    return null;
  }
}

export async function decodeImageFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not read that image.'));
      i.src = url;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const code = decodeImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
    return code?.data?.trim() || null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** UPI deep links: upi://pay?pa=…&pn=…&am=…  (also gpay://upi/pay, paytmmp://pay, phonepe://pay) */
const UPI_RE = /^(upi|gpay|paytmmp|phonepe|bhim|tez):\/\//i;

export function parseQrContent(raw) {
  const text = String(raw || '').trim();
  if (!text) return { kind: 'text', raw: text };

  if (UPI_RE.test(text)) {
    const query = text.includes('?') ? text.slice(text.indexOf('?') + 1) : '';
    const p = new URLSearchParams(query);
    const amount = p.get('am') ? Number(p.get('am')) : null;
    return {
      kind: 'upi',
      raw: text,
      upi: {
        payeeAddress: p.get('pa') || '',
        payeeName: p.get('pn') || '',
        amount: Number.isFinite(amount) ? amount : null,
        currency: p.get('cu') || 'INR',
        note: p.get('tn') || '',
        merchantCode: p.get('mc') || '',
        txnRef: p.get('tr') || '',
        url: p.get('url') || '',
      },
    };
  }

  if (/^https?:\/\//i.test(text) || /^www\./i.test(text)) return { kind: 'url', raw: text, url: text };

  if (/^WIFI:/i.test(text)) {
    const get = (k) => (text.match(new RegExp(`${k}:([^;]*)`, 'i')) || [])[1] || '';
    return { kind: 'wifi', raw: text, wifi: { ssid: get('S'), security: get('T') || 'nopass', hidden: get('H') === 'true' } };
  }
  if (/^tel:/i.test(text)) return { kind: 'tel', raw: text, phone: text.slice(4) };
  if (/^(mailto|sms|smsto):/i.test(text)) return { kind: 'contact', raw: text };
  if (/^BEGIN:VCARD/i.test(text)) return { kind: 'vcard', raw: text };

  // Bare domain without scheme → treat as a link
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(text)) return { kind: 'url', raw: text, url: text };

  return { kind: 'text', raw: text };
}
