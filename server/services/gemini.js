/**
 * Gemini (Google GenAI SDK) helpers.
 *  - explainFindings(): 2–3 plain-language sentences for the Result page
 *  - analyzeMessage():  strict-JSON scam analysis (Phase 3)
 * Model name comes from GEMINI_MODEL so it can be swapped without code changes.
 */
import { GoogleGenAI } from '@google/genai';
import { hasKey } from '../utils/config.js';

const model = () => process.env.GEMINI_MODEL || 'gemini-3.8-flash';
let _ai = null;
// 12 s cap: the explanation is a nice-to-have, so a slow model never stalls a scan
const ai = () => (_ai ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout: 12000 } }));

/** Gemini occasionally answers 503 "high demand"; wait briefly and retry once before giving up. */
async function generate(params) {
  try {
    return await ai().models.generateContent(params);
  } catch (err) {
    if (!/503|UNAVAILABLE|high demand/i.test(err.message || '')) throw err;
    await new Promise((r) => setTimeout(r, 1500));
    return ai().models.generateContent(params);
  }
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
    const res = await generate({ model: model(), contents: prompt, config: {
        temperature: 0.4,
        // Newer Gemini models spend output tokens on internal "thinking"; give
        // headroom and turn thinking off for this short, simple task.
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
      } });
    const text = (res.text || '').trim();
    return text ? { available: true, text } : { available: false, text: fallbackExplanation(ctx) };
  } catch (err) {
    console.warn('[gemini] explain failed:', err.message);
    return { available: false, text: fallbackExplanation(ctx) };
  }
}

const MESSAGE_SYSTEM_PROMPT = `You are a scam-detection expert for SMS and email messages, especially Indian scams
(KYC fraud, OTP theft, fake job offers, electricity-bill disconnection threats, lottery/prize, UPI "receive money", courier/customs, loan apps).
Analyse the user's message and respond with STRICT JSON ONLY — no markdown, no commentary — matching exactly:
{"verdict":"safe|suspicious|scam","riskScore":0-100,"scamType":"string (or 'none')","redFlags":[{"phrase":"exact phrase copied from the message","reason":"why it is a red flag"}],"explanation":"2-3 plain sentences","advice":"1-2 sentences of what the user should do"}
Rules: phrases in redFlags must be copied verbatim from the message. riskScore reflects how likely this is a scam.`;

/** Phase 3: strict-JSON scam analysis of a message. */
export async function analyzeMessage(text) {
  if (!hasKey('GEMINI_API_KEY')) return { available: false, reason: 'not_configured' };
  try {
    const res = await generate({
      model: model(),
      contents: text,
      config: { systemInstruction: MESSAGE_SYSTEM_PROMPT, responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 2048 },
    });
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
