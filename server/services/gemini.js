/**
 * Gemini (Google GenAI SDK) helpers.
 *  - explainFindings(): 2–3 plain-language sentences for the Result page
 *  - analyzeMessage():  strict-JSON scam analysis (Phase 3)
 * Model name comes from GEMINI_MODEL so it can be swapped without code changes.
 */
import { GoogleGenAI } from '@google/genai';
import { hasKey } from '../utils/config.js';

const DEFAULT_MODEL = 'gemini-3.5-flash';
/**
 * Models to try, in order, when the configured one fails with 404 (retired),
 * 429 (free-tier quota exhausted) or 503/504 (overloaded). The configured
 * GEMINI_MODEL always goes first. Once a model fails hard we skip it for the
 * rest of the process so every scan doesn't pay the failure again.
 */
const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
// model → timestamp until which it is skipped (Infinity = retired, 60 s = quota cooldown)
const disabledUntil = new Map();
const quotaRotated = new Set(); // models we already rotated keys for in this cooldown window
const QUOTA_COOLDOWN_MS = 60 * 1000;
const OUTAGE_COOLDOWN_MS = 30 * 1000; // after a 503/504/timeout, don't retry that model for 30 s
const candidates = () =>
  [...new Set([process.env.GEMINI_MODEL || DEFAULT_MODEL, ...FALLBACK_MODELS])].filter((m) => (disabledUntil.get(m) || 0) < Date.now());
export const model = () => candidates()[0] || DEFAULT_MODEL;

/**
 * API keys: GEMINI_API_KEY may hold several keys separated by commas. The free
 * tier is per Google Cloud project, so a second key from a second project
 * doubles the daily allowance. On a 429 we move to the next key before
 * falling back to another model.
 */
const keys = () => (process.env.GEMINI_API_KEY || '').split(',').map((k) => k.trim()).filter(Boolean);
let keyIndex = 0;
const clients = new Map(); // key → GoogleGenAI
// 10 s cap per call: the AI text is a nice-to-have, so a slow model never stalls a scan
const ai = () => {
  const list = keys();
  const key = list[keyIndex % list.length];
  if (!clients.has(key)) clients.set(key, new GoogleGenAI({ apiKey: key, httpOptions: { timeout: 10000 } }));
  return clients.get(key);
};
const rotateKey = () => {
  const n = keys().length;
  if (n < 2) return false;
  keyIndex = (keyIndex + 1) % n;
  console.warn(`[gemini] switching to API key #${keyIndex + 1} of ${n}`);
  return true;
};

/** Hard cap for a whole Gemini step (all fallback models included). Resolves to null on timeout. */
const withCap = (promise, ms) =>
  Promise.race([promise.catch(() => null), new Promise((r) => setTimeout(() => r(null), ms))]);

const EXPLAIN_CAP_MS = 8000;   // nice-to-have text: never make the user wait longer than this
const ANALYZE_CAP_MS = 20000;  // message classification is the main result, allow a bit more

async function generate(params) {
  let lastErr;
  for (const m of candidates()) {
    // "lite" models reject thinkingConfig — strip it for them
    const config = /lite/.test(m) && params.config?.thinkingConfig ? { ...params.config, thinkingConfig: undefined } : params.config;
    try {
      return await ai().models.generateContent({ ...params, model: m, config });
    } catch (err) {
      lastErr = err;
      const msg = err.message || '';
      if (/404|NOT_FOUND|no longer available/i.test(msg)) {
        console.warn(`[gemini] model ${m} not found — retired? trying next model`);
        disabledUntil.set(m, Infinity);
        continue;
      }
      if (/429|RESOURCE_EXHAUSTED|quota/i.test(msg)) {
        // Quota is per key+model. Try the same model on the next key first (if any),
        // otherwise rest this model for a minute and move on.
        if (!quotaRotated.has(m) && rotateKey()) {
          quotaRotated.add(m);
          setTimeout(() => quotaRotated.delete(m), QUOTA_COOLDOWN_MS).unref?.();
          return generate(params);
        }
        console.warn(`[gemini] model ${m} quota exceeded — cooling down 60 s, trying next model`);
        disabledUntil.set(m, Date.now() + QUOTA_COOLDOWN_MS);
        continue;
      }
      if (/503|504|UNAVAILABLE|DEADLINE|high demand|timeout/i.test(msg)) {
        console.warn(`[gemini] ${m} slow/overloaded — resting it 30 s, trying next model`);
        disabledUntil.set(m, Date.now() + OUTAGE_COOLDOWN_MS);
        continue;
      }
      throw err;
    }
  }
  throw lastErr || new Error('No Gemini model available');
}

/** Fallback text when Gemini is unavailable, so the UI always has an explanation. */
export function fallbackExplanation({ scanType, verdict, score, breakdown, unavailable = [] }) {
  const reasons = breakdown.map((b) => b.label.toLowerCase());
  const what = { url: 'link', file: 'file', ip: 'IP address', message: 'message' }[scanType] || 'item';
  const gap = unavailable.length ? ` Note: ${unavailable.join(' and ')} could not be checked, so this result is incomplete.` : '';
  if (verdict === 'safe') {
    return `This ${what} scored ${score}/100 and looks safe. None of our security sources reported a problem${reasons.length ? `, apart from: ${reasons.join('; ')}` : ''}.${gap} Stay alert anyway and never share OTPs or passwords.`;
  }
  if (verdict === 'suspicious') {
    return `This ${what} scored ${score}/100 and is suspicious because ${reasons.join('; ') || 'of mixed signals'}. Do not enter personal or banking details here unless you are certain it is genuine.`;
  }
  return `This ${what} scored ${score}/100 and is dangerous: ${reasons.join('; ') || 'multiple security sources flagged it'}. Do not open it, do not enter any details, and warn anyone who shared it with you.`;
}

export async function explainFindings(ctx) {
  if (!hasKey('GEMINI_API_KEY')) return { available: false, text: fallbackExplanation(ctx) };
  const { scanType, input, verdict, score, breakdown, extra = {}, unavailable = [] } = ctx;
  const prompt = `You are CyberShield, a friendly cyber-security assistant for everyday users in India.
A ${scanType} scan finished with threat score ${score}/100 and verdict "${verdict}".
Input: ${input}
Findings: ${breakdown.length ? breakdown.map((b) => `${b.label} (+${b.points})`).join('; ') : 'no negative findings'}
${unavailable.length ? `Sources that could NOT be checked (mention this briefly): ${unavailable.join(', ')}` : ''}
${Object.entries(extra).map(([k, v]) => `${k}: ${v}`).join('\n')}
Write 2–3 short, plain-English sentences (no jargon, no markdown, no bullet points) telling the user
what was found and what they should do. Be calm and specific.`;
  try {
    const res = await withCap(generate({ contents: prompt, config: {
        temperature: 0.4,
        // Newer Gemini models spend output tokens on internal "thinking"; give
        // headroom and turn thinking off for this short, simple task.
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
      } }), EXPLAIN_CAP_MS);
    if (!res) return { available: false, text: fallbackExplanation(ctx) };
    const text = (res.text || '').trim();
    return text ? { available: true, text } : { available: false, text: fallbackExplanation(ctx) };
  } catch (err) {
    console.warn('[gemini] explain failed:', err.message);
    return { available: false, text: fallbackExplanation(ctx) };
  }
}

const MESSAGE_SYSTEM_PROMPT = `You are a scam-detection expert for SMS and email messages, especially Indian scams
(KYC fraud, OTP theft, fake job offers, electricity-bill disconnection threats, lottery/prize, UPI "receive money", courier/customs, loan apps, "digital arrest" police impersonation).
Messages may be in English, Hindi or Hinglish (Hindi written in Latin letters) — analyse them all the same way.
Analyse the user's message and respond with STRICT JSON ONLY — no markdown, no commentary — matching exactly:
{"verdict":"safe|suspicious|scam","riskScore":0-100,"scamType":"string (or 'none')","redFlags":[{"phrase":"exact phrase copied from the message","reason":"why it is a red flag"}],"explanation":"2-3 plain sentences","advice":"1-2 sentences of what the user should do"}
Rules: phrases in redFlags must be copied verbatim from the message. riskScore reflects how likely this is a scam.`;

/** Phase 3: strict-JSON scam analysis of a message. */
export async function analyzeMessage(text) {
  if (!hasKey('GEMINI_API_KEY')) return { available: false, reason: 'not_configured' };
  try {
    const res = await withCap(generate({
      contents: text,
      config: { systemInstruction: MESSAGE_SYSTEM_PROMPT, responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
    }), ANALYZE_CAP_MS);
    if (!res) return { available: false, reason: 'timeout' };
    const raw = (res.text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const json = JSON.parse(raw);
    return {
      available: true,
      verdict: ['safe', 'suspicious', 'scam'].includes(json.verdict) ? json.verdict : 'suspicious',
      riskScore: Math.max(0, Math.min(100, Number(json.riskScore) || 0)),
      scamType: String(json.scamType || 'none'),
      redFlags: Array.isArray(json.redFlags) ? json.redFlags.slice(0, 10).map((f) => ({ phrase: String(f.phrase || ''), reason: String(f.reason || '') })).filter((f) => f.phrase) : [],
      explanation: String(json.explanation || ''),
      advice: String(json.advice || ''),
    };
  } catch (err) {
    console.warn('[gemini] analyzeMessage failed:', err.message);
    return { available: false, reason: 'error' };
  }
}
