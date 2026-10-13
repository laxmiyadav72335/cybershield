import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidHttpUrl } from '../src/lib/urlValidation.js';
import { normalizeUrl } from '../../server/utils/urlUtils.js';

test('link form accepts supported domains and IPv4/IPv6 URL hosts', () => {
  for (const value of ['example.com', 'https://example.com/login', 'http://127.0.0.1/', 'https://[2606:4700:4700::1111]/', 'https://[::1]/']) {
    assert.equal(isValidHttpUrl(value), true, value);
    assert.ok(normalizeUrl(value));
  }
});

test('link form rejects malformed, unsupported and oversized links', () => {
  for (const value of ['', 'not a url', 'https://', 'ftp://example.com', 'https://[invalid]/', `https://example.com/${'a'.repeat(2048)}`]) {
    assert.equal(isValidHttpUrl(value), false, value);
    assert.equal(normalizeUrl(value), null);
  }
});
