import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseQrContent } from '../src/lib/qr.js';

test('web links with payment-like parameters still go through the link scanner', () => {
  for (const raw of ['https://example.com/login?pa=merchant@paytm', 'http://example.com/?pa=refund@okaxis', 'www.example.com/?pa=merchant@upi']) {
    const parsed = parseQrContent(raw);
    assert.equal(parsed.kind, 'url');
    assert.equal(parsed.url, raw);
  }
});

test('supported payment schemes retain their UPI fields', () => {
  for (const scheme of ['upi', 'gpay', 'paytmmp', 'phonepe', 'bhim', 'tez']) {
    const parsed = parseQrContent(`${scheme}://pay?pa=merchant@paytm&pn=Shop&am=50`);
    assert.equal(parsed.kind, 'upi');
    assert.equal(parsed.upi.payeeAddress, 'merchant@paytm');
    assert.equal(parsed.upi.amount, 50);
  }
});
