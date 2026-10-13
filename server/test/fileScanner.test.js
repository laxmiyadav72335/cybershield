import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scanFile } from '../services/fileScanner.js';
import { scoreFile } from '../utils/threatScore.js';

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
