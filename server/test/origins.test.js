import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allowedClientOrigins } from '../utils/origins.js';

test('accepts both loopback hostnames for the configured local client', () => {
  assert.deepEqual(allowedClientOrigins('http://localhost:5173'), [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]);
});

test('does not widen a production origin', () => {
  assert.deepEqual(allowedClientOrigins('https://example.vercel.app'), ['https://example.vercel.app']);
});
