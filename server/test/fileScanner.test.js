import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scanFile } from '../services/fileScanner.js';

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
