/**
 * MODULE 3 — SMS / Email Scam Checker.
 *  a) Gemini analyses the text and returns strict JSON (verdict, riskScore, redFlags…)
 *     — rule-based heuristics run as a fallback / second opinion.
 *  b) Every URL inside the message is extracted and run through Module 1.
 *  c) The Result page highlights the red-flag phrases in the original text.
 */
import { analyzeMessage, explainFindings } from './gemini.js';
import { analyzeMessageHeuristics } from '../utils/messageHeuristics.js';
import { extractUrls } from '../utils/urlUtils.js';
import { scanUrl } from './urlScanner.js';
import { scoreMessage } from '../utils/threatScore.js';
import { httpError } from '../middleware/errorHandler.js';

const MAX_CHARS = 5000;
const MAX_LINKS = 3; // keep VirusTotal quota in check

export async function scanMessage(rawText) {
  const text = String(rawText || '').trim();
  if (!text) throw httpError(400, 'missing_text', 'Paste the SMS or email text to check.');
  if (text.length > MAX_CHARS) throw httpError(400, 'text_too_long', `Message is too long (max ${MAX_CHARS} characters).`);

  const urls = extractUrls(text).slice(0, MAX_LINKS);

  // AI + rules + link scans all in parallel
  const [aiRaw, linkReports] = await Promise.all([
    analyzeMessage(text),
    Promise.all(urls.map((u) => scanUrl(u).catch(() => null))),
  ]);
  const rules = analyzeMessageHeuristics(text);

  // Prefer Gemini; fall back to rules. Merge rule red-flags the AI missed.
  const ai = aiRaw.available ? { ...aiRaw, source: 'gemini' } : rules;
  if (aiRaw.available) {
    const seen = new Set(ai.redFlags.map((f) => f.phrase.toLowerCase()));
    for (const f of rules.redFlags) if (!seen.has(f.phrase.toLowerCase())) ai.redFlags.push(f);
  }

  const links = linkReports
    .filter(Boolean)
    .map((r) => ({ url: r.input, threatScore: r.threatScore, verdict: r.verdict, summary: r.summary, domain: r.domain }));

  const { score, verdict, breakdown } = scoreMessage({ ai, linkScans: links });

  // Explanation: Gemini's own text if available, otherwise generate / fallback
  let explanation = aiRaw.available ? aiRaw.explanation : '';
  let aiAvailable = aiRaw.available;
  if (!explanation) {
    const gen = await explainFindings({
      scanType: 'message',
      input: text.slice(0, 400),
      verdict,
      score,
      breakdown,
      extra: { 'Scam type': ai.scamType, 'Red flags': ai.redFlags.map((f) => f.phrase).join(' | ') || 'none' },
    });
    explanation = gen.text;
    aiAvailable = gen.available;
  }

  const summary =
    verdict === 'safe'
      ? 'No scam patterns detected in this message.'
      : `Looks like a ${ai.scamType && ai.scamType !== 'none' ? ai.scamType : 'scam'} — ${ai.redFlags.length} red flag${ai.redFlags.length === 1 ? '' : 's'} found${links.length ? ` and ${links.length} link${links.length === 1 ? '' : 's'} checked` : ''}.`;

  return {
    scanType: 'message',
    input: text,
    inputPreview: text.length > 80 ? `${text.slice(0, 77)}…` : text,
    threatScore: score,
    verdict,
    summary,
    explanation,
    aiAvailable,
    advice: ai.advice || '',
    breakdown,
    sources: { ai, rules, links },
    unavailableSources: aiRaw.available ? [] : ['Gemini AI (rule-based analysis used)'],
    scannedAt: new Date().toISOString(),
    cached: false,
  };
}
