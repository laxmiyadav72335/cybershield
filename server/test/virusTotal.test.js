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
