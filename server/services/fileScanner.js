/**
 * MODULE 2 — File Scanner ("hash-first").
 *  1. The browser computes SHA-256 and sends it (cheap JSON request).
 *  2. We look the hash up on VirusTotal. Known file → instant report, no upload.
 *  3. Unknown → the browser re-sends the file (multipart); we upload it to
 *     VirusTotal, poll the analysis, then drop the Buffer. Nothing is stored.
 */
import { lookupFileHash, uploadFileToVirusTotal } from './virusTotal.js';
import { explainFindings } from './gemini.js';
import { scoreFile } from '../utils/threatScore.js';
import { cacheGet, cacheSet } from '../utils/cache.js';
import { httpError } from '../middleware/errorHandler.js';

const SHA256_RE = /^[a-f0-9]{64}$/i;

const prettyBytes = (n) => {
  if (!n && n !== 0) return null;
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i ? 1 : 0)} ${u[i]}`;
};

export async function scanFile({ sha256, fileName, size, mimeType, buffer }) {
  if (!SHA256_RE.test(sha256 || '')) throw httpError(400, 'invalid_hash', 'A valid SHA-256 hash is required.');
  const hash = sha256.toLowerCase();
  const safeName = String(fileName || 'file').slice(0, 120);

  const cacheKey = `file:${hash}`;
  const cached = cacheGet(cacheKey);
  if (cached) return { ...cached, cached: true };

  // Step 2: hash lookup
  let vt = await lookupFileHash(hash);

  // Step 3: unknown + we have the bytes → upload. Unknown + no bytes → ask the client to send them.
  if (vt.available && vt.status === 'not_found') {
    if (!buffer) return { needsUpload: true, sha256: hash, message: 'This file is not known to VirusTotal yet. Upload it for a fresh analysis.' };
    vt = await uploadFileToVirusTotal(buffer, safeName);
    buffer = null; // explicit: let the Buffer be garbage-collected immediately
  }

  const { score, verdict, breakdown } = scoreFile({ virusTotal: vt });
  const flagged = vt.stats ? vt.stats.malicious + vt.stats.suspicious : 0;

  const ai = await explainFindings({
    scanType: 'file',
    input: `${safeName} (${vt.fileType || mimeType || 'unknown type'}, ${prettyBytes(size) || 'unknown size'})`,
    verdict,
    score,
    breakdown,
    unavailable: vt.available ? [] : ['VirusTotal'],
    extra: {
      'Malware families': vt.families?.length ? vt.families.join(', ') : 'none',
      'VirusTotal': vt.available && vt.stats ? `${flagged} of ${vt.engines.length} engines flagged it` : vt.status,
    },
  });

  const summary = !vt.available
    ? 'VirusTotal could not be queried — no detection data for this file.'
    : vt.status === 'queued'
      ? 'Analysis is still running on VirusTotal. Check back in a minute.'
      : flagged === 0
        ? `Clean — none of ${vt.engines.length} antivirus engines detected anything.`
        : `${flagged} of ${vt.engines.length} antivirus engines detected ${vt.popularThreat || 'malware'}.`;

  const report = {
    scanType: 'file',
    input: safeName,
    inputPreview: safeName,
    fileName: safeName,
    sha256: hash,
    size: size ?? vt.size ?? null,
    sizeLabel: prettyBytes(size ?? vt.size),
    mimeType: mimeType || null,
    threatScore: score,
    verdict,
    summary,
    explanation: ai.text,
    aiAvailable: ai.available,
    breakdown,
    sources: { virusTotal: vt },
    unavailableSources: vt.available ? [] : ['VirusTotal'],
    scannedAt: new Date().toISOString(),
    cached: false,
  };
  cacheSet(cacheKey, report, vt.status === 'completed' ? undefined : 60 * 1000);
  return report;
}
