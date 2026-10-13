import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scanFile } from '../services/fileScanner.js';
import { scoreFile } from '../utils/threatScore.js';
import { cacheSet } from '../utils/cache.js';

test('rejects uploaded bytes that do not match the supplied SHA-256', async () => {
  await assert.rejects(
    scanFile({
      sha256: '0'.repeat(64),
      fileName: 'sample.txt',
      buffer: Buffer.from('different contents'),
    }),
    { status: 400, code: 'hash_mismatch' },
  );
});

test('file scans without engine results are unscored', () => {
  for (const virusTotal of [
    { available: false, status: 'rate_limited' },
    { available: true, status: 'queued', stats: null },
  ]) {
    assert.deepEqual(scoreFile({ virusTotal }), { score: null, verdict: 'unknown', breakdown: [] });
  }
  assert.equal(scoreFile({ virusTotal: { available: true, stats: { malicious: 0, suspicious: 0 } } }).verdict, 'safe');
});

test('cached detection results retain the current file identity', async () => {
  const hash = 'a'.repeat(64);
  cacheSet(`file:${hash}`, { input: 'first.txt', inputPreview: 'first.txt', fileName: 'first.txt', size: 5, sizeLabel: '5 B', mimeType: 'text/plain', threatScore: 0, verdict: 'safe' });
  const report = await scanFile({ sha256: hash, fileName: 'renamed.bin', size: 5, mimeType: 'application/octet-stream' });
  assert.equal(report.fileName, 'renamed.bin');
  assert.equal(report.input, 'renamed.bin');
  assert.equal(report.inputPreview, 'renamed.bin');
  assert.equal(report.mimeType, 'application/octet-stream');
  assert.equal(report.cached, true);
  assert.equal(report.threatScore, 0);
});
