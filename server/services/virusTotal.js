/**
 * VirusTotal API v3 — URL and file lookups.
 * Docs: https://docs.virustotal.com/reference/overview
 *
 * URL flow ("hash-first", saves quota):
 *   1. GET /urls/{id}  where id = base64url(url) without "=" padding
 *   2. 404 → POST /urls to submit, then poll GET /analyses/{analysisId}
 * File flow (Phase 3): GET /files/{sha256} → 404 → POST /files (multipart)
 *
 * Every function returns { available, status, stats, engines[] } and never throws.
 * status: 'completed' | 'queued' | 'rate_limited' | 'not_configured' | 'error'
 */
import axios from 'axios';
import { hasKey } from '../utils/config.js';

const BASE = 'https://www.virustotal.com/api/v3';
const POLL_ATTEMPTS = 5;
const POLL_DELAY_MS = 3000;

const client = () =>
  axios.create({
    baseURL: BASE,
    timeout: 15000,
    headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY, accept: 'application/json' },
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** base64url without padding, as VirusTotal expects for URL identifiers. */
export const vtUrlId = (url) => Buffer.from(url).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Normalise VT's per-engine results object into a sorted array for the UI grid. */
function toEngineList(results = {}) {
  return Object.values(results)
    .map((r) => ({
      name: r.engine_name,
      category: r.category, // harmless | undetected | malicious | suspicious | timeout | type-unsupported
      result: r.result || null,
    }))
    .sort((a, b) => {
      const rank = { malicious: 0, suspicious: 1, harmless: 2, undetected: 3 };
      return (rank[a.category] ?? 4) - (rank[b.category] ?? 4) || a.name.localeCompare(b.name);
    });
}

export function fromAttributes(attrs, extra = {}) {
  const rawStats = attrs.last_analysis_stats || attrs.stats;
  const hasStats = rawStats && Object.keys(rawStats).length > 0;
  const stats = hasStats ? rawStats : {};
  const results = attrs.last_analysis_results || attrs.results || {};
  return {
    available: true,
    status: hasStats ? 'completed' : 'queued',
    stats: hasStats ? {
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0,
      timeout: stats.timeout || 0,
    } : null,
    engines: toEngineList(results),
    ...extra,
  };
}

function handleError(err, context) {
  const status = err.response?.status;
  if (status === 429) {
    return { available: false, status: 'rate_limited', reason: 'rate_limited', message: 'VirusTotal is busy (free quota ~4 requests/min). Please try again in a minute.' };
  }
  console.warn(`[virusTotal:${context}] failed:`, status || err.message);
  return { available: false, status: 'error', reason: 'error' };
}

/** Poll an analysis until completed or attempts run out. */
async function pollAnalysis(analysisId) {
  const vt = client();
  for (let i = 0; i < POLL_ATTEMPTS; i++) {
    await sleep(POLL_DELAY_MS);
    const { data } = await vt.get(`/analyses/${analysisId}`);
    const attrs = data?.data?.attributes || {};
    if (attrs.status === 'completed') return fromAttributes(attrs, { analysisId });
  }
  return { available: true, status: 'queued', analysisId, stats: null, engines: [], message: 'VirusTotal is still analysing this item. Try again in a minute for full engine results.' };
}

/** @param {{quick?: boolean}} opts quick = submit unknown URLs but don't wait for the analysis (used for links inside messages) */
export async function scanUrlWithVirusTotal(url, { quick = false } = {}) {
  if (!hasKey('VIRUSTOTAL_API_KEY')) return { available: false, status: 'not_configured', reason: 'not_configured' };
  const vt = client();
  const id = vtUrlId(url);
  const permalink = `https://www.virustotal.com/gui/url/${id}`;

  // 1) Try existing report
  try {
    const { data } = await vt.get(`/urls/${id}`);
    const attrs = data.data.attributes;
    const known = fromAttributes(attrs, { permalink, lastAnalysisDate: attrs.last_analysis_date ? new Date(attrs.last_analysis_date * 1000).toISOString() : null });
    // A URL object with no analysis stats has never been analysed — fall through and submit it
    if (known.stats) return known;
  } catch (err) {
    if (err.response?.status !== 404) return handleError(err, 'get-url');
  }

  // 2) Not known → submit and poll
  try {
    const form = new URLSearchParams({ url });
    const { data } = await vt.post('/urls', form, { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    const analysisId = data?.data?.id;
    if (quick) {
      return { available: true, status: 'queued', analysisId, stats: null, engines: [], permalink, submitted: true, message: 'Submitted to VirusTotal — engine results will be ready in about a minute.' };
    }
    const result = await pollAnalysis(analysisId);
    return { ...result, permalink, submitted: true };
  } catch (err) {
    return handleError(err, 'submit-url');
  }
}

/** Phase 3: file lookup by SHA-256. */
export async function lookupFileHash(sha256) {
  if (!hasKey('VIRUSTOTAL_API_KEY')) return { available: false, status: 'not_configured', reason: 'not_configured' };
  try {
    const { data } = await client().get(`/files/${sha256}`);
    const attrs = data.data.attributes;
    return fromAttributes(attrs, {
      found: true,
      permalink: `https://www.virustotal.com/gui/file/${sha256}`,
      fileType: attrs.type_description || attrs.type_tag || null,
      names: (attrs.names || []).slice(0, 3),
      popularThreat: attrs.popular_threat_classification?.suggested_threat_label || null,
      families: (attrs.popular_threat_classification?.popular_threat_name || []).map((t) => t.value),
      size: attrs.size,
    });
  } catch (err) {
    if (err.response?.status === 404) return { available: true, status: 'not_found', found: false };
    return handleError(err, 'get-file');
  }
}

/** Phase 3: upload an unknown file buffer (≤ 32 MB) then poll. */
export async function uploadFileToVirusTotal(buffer, filename) {
  if (!hasKey('VIRUSTOTAL_API_KEY')) return { available: false, status: 'not_configured', reason: 'not_configured' };
  try {
    const form = new FormData();
    form.append('file', new Blob([buffer]), filename);
    const { data } = await client().post('/files', form, { timeout: 60000 });
    const analysisId = data?.data?.id;
    return { ...(await pollAnalysis(analysisId)), submitted: true };
  } catch (err) {
    return handleError(err, 'upload-file');
  }
}
