import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidIp } from '../src/lib/ipValidation.js';

test('accepts valid IPv4, IPv6 and mapped IPv6 addresses', () => {
  for (const ip of ['8.8.8.8', 'fe90::1', '2001:4860:4860::8888', '::ffff:192.0.2.1']) {
    assert.equal(isValidIp(ip), true, ip);
  }
});

test('rejects malformed IP addresses before submitting the form', () => {
  for (const ip of ['999.1.1.1', '001.2.3.4', 'fe90:::1', '2001::db8::1', 'example.com']) {
    assert.equal(isValidIp(ip), false, ip);
  }
});
