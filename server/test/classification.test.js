import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeMessageHeuristics } from '../utils/messageHeuristics.js';
import { normalizeUrl, analyzeUrlHeuristics } from '../utils/urlUtils.js';
import { ipReputationSummary, isNonPublicIp, scanIp } from '../services/ipScanner.js';
import { scoreMessage } from '../utils/threatScore.js';

test('protective OTP advice is not treated as a request for the code', () => {
  assert.equal(analyzeMessageHeuristics('Do not ever share your OTP with anyone.').redFlags.length, 0);
  assert.equal(analyzeMessageHeuristics('OTP share mat karo').redFlags.length, 0);
  assert.ok(analyzeMessageHeuristics('Please share your OTP to receive a refund.').redFlags.some((flag) => flag.reason.includes('OTP')));
});

test('only URL userinfo triggers the at-sign disguise flag', () => {
  assert.equal(analyzeUrlHeuristics(normalizeUrl('https://example.com/?email=alice@example.net')).hasAtSymbol, false);
  assert.equal(analyzeUrlHeuristics(normalizeUrl('https://alice@example.com/')).hasAtSymbol, true);
});

test('non-public IPv6 ranges are excluded from reputation lookups', () => {
  for (const ip of ['::', '::1', 'fc00::1', 'fe80::1', 'fe90::1', 'febf::1', 'ff02::1', '2001:db8::1']) {
    assert.equal(isNonPublicIp(ip), true, `${ip} should be non-public`);
  }
  assert.equal(isNonPublicIp('2606:4700:4700::1111'), false);
});

test('non-public IPs have no safe verdict or threat score', async () => {
  const report = await scanIp('fe90::1');
  assert.equal(report.verdict, 'unknown');
  assert.equal(report.threatScore, null);
  assert.equal(report.aiAvailable, false);
});

test('zero abuse confidence does not erase reported abuse', () => {
  assert.match(ipReputationSummary({ available: true, abuseConfidenceScore: 0, totalReports: 235, numDistinctUsers: 92, isWhitelisted: true }), /235 abuse reports.*0% confidence/);
});

test('strong local scam evidence raises a low AI risk score', () => {
  const ai = { available: true, source: 'gemini', riskScore: 5, scamType: 'none' };
  const rules = { available: true, source: 'rules', riskScore: 75, scamType: 'KYC fraud' };
  const result = scoreMessage({ ai, rules });
  assert.equal(result.score, 75);
  assert.equal(result.verdict, 'dangerous');
  assert.ok(result.breakdown.some((item) => item.label.includes('Local scam patterns')));
});
