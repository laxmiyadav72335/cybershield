import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPdf } from '../src/lib/pdfReport.js';

test('UPI PDF encodes currency in its summary, breakdown and findings', () => {
  const report = {
    scanType: 'qr', verdict: 'dangerous', threatScore: 70,
    scannedAt: '2026-10-13T12:00:00.000Z',
    inputPreview: 'QR → UPI payment',
    summary: 'This QR asks you to PAY ₹4,999.',
    explanation: 'Do not pay ₹4,999 to receive a refund.',
    breakdown: [{ label: 'Pre-filled amount ₹4,999', points: 15 }],
    sources: { upi: { payeeAddress: 'test@upi', payeeName: 'Shop ₹', amount: 4999 } },
    qr: { kind: 'upi', raw: 'upi://pay?pa=test@upi' },
  };
  const output = buildPdf(report).output();
  assert.ok(output.includes('This QR asks you to PAY INR 4,999.'));
  assert.ok(output.includes('Pre-filled amount INR 4,999'));
  assert.ok(output.includes('Do not pay INR 4,999 to receive a refund.'));
  assert.ok(output.includes('QR -> UPI payment'));
  assert.ok(output.includes('Shop INR '));
  assert.ok(!output.includes('\u0000'));
});
