import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fromAttributes } from '../services/virusTotal.js';

test('VirusTotal reports without engine statistics remain queued', () => {
  const report = fromAttributes({ last_analysis_results: {} });
  assert.equal(report.status, 'queued');
  assert.equal(report.stats, null);
});

test('VirusTotal reports with engine statistics are complete', () => {
  const report = fromAttributes({ last_analysis_stats: { malicious: 0, harmless: 1 } });
  assert.equal(report.status, 'completed');
  assert.equal(report.stats.harmless, 1);
});

test('zero or unfinished engine statistics do not produce a clean result', () => {
  for (const attrs of [
    { last_analysis_stats: { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 } },
    { status: 'queued', stats: { harmless: 1 } },
    { last_analysis_stats: { timeout: 3, failure: 2 } },
  ]) {
    const report = fromAttributes(attrs);
    assert.equal(report.status, 'queued');
    assert.equal(report.stats, null);
  }
});
