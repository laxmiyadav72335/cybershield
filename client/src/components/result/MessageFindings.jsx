import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SourceCard from './SourceCard';
import GlassCard from '../ui/GlassCard';
import Icon from '../ui/Icon';
import { VERDICTS } from '../../config/scanners';

/**
 * Splits the original message into plain / highlighted segments so each
 * red-flag phrase is wrapped in a <mark>. Longest phrases are matched first
 * to avoid partial overlaps. Case-insensitive, first occurrence per phrase.
 */
function highlight(text, flags) {
  const ranges = [];
  const lower = text.toLowerCase();
  [...flags].sort((a, b) => b.phrase.length - a.phrase.length).forEach((f, idx) => {
    const p = f.phrase.toLowerCase();
    if (!p) return;
    let from = 0;
    while (from < lower.length) {
      const i = lower.indexOf(p, from);
      if (i === -1) break;
      const overlaps = ranges.some((r) => i < r.end && i + p.length > r.start);
      if (!overlaps) ranges.push({ start: i, end: i + p.length, idx, reason: f.reason });
      from = i + p.length;
    }
  });
  ranges.sort((a, b) => a.start - b.start);
  const out = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) out.push({ text: text.slice(cursor, r.start) });
    out.push({ text: text.slice(r.start, r.end), mark: true, reason: r.reason, idx: r.idx });
    cursor = r.end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor) });
  return out;
}

export default function MessageFindings({ result }) {
  const { ai, links } = result.sources;
  const segments = highlight(result.input, ai.redFlags || []);
  const aiStatus = ai.verdict === 'scam' ? 'danger' : ai.verdict === 'suspicious' ? 'warn' : 'ok';

  return (
    <div className="space-y-6">
      {/* Highlighted message */}
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Your message with red flags highlighted</h3>
          <span className="text-xs text-slate-500">{ai.redFlags?.length || 0} flagged</span>
        </div>
        <p className="whitespace-pre-wrap rounded-xl bg-bg-900/60 p-4 text-sm leading-7 text-slate-200">
          {segments.map((s, i) =>
            s.mark ? (
              <motion.mark
                key={i}
                initial={{ backgroundColor: 'rgba(239,68,68,0)' }}
                animate={{ backgroundColor: 'rgba(239,68,68,0.28)' }}
                transition={{ delay: 0.4 + s.idx * 0.15 }}
                title={s.reason}
                className="rounded px-1 text-white underline decoration-danger decoration-2 underline-offset-4"
              >
                {s.text}
              </motion.mark>
            ) : (
              <span key={i}>{s.text}</span>
            ),
          )}
        </p>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2">
        <SourceCard
          title={ai.source === 'gemini' ? 'Gemini AI analysis' : 'Rule-based analysis'}
          status={aiStatus}
          statusLabel={ai.verdict === 'scam' ? 'Scam' : ai.verdict === 'suspicious' ? 'Suspicious' : 'Looks genuine'}
          delay={0.1}
        >
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-slate-300">Type: <span className="text-white">{ai.scamType || 'none'}</span></span>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-slate-300">AI risk: <span className="text-white">{ai.riskScore}/100</span></span>
          </div>
          {ai.redFlags?.length ? (
            <ul className="space-y-2">
              {ai.redFlags.map((f, i) => (
                <li key={i} className="flex gap-2 text-xs">
                  <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                  <span>
                    <span className="font-medium text-white">“{f.phrase}”</span>
                    <span className="text-slate-400"> — {f.reason}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">No scam phrases were detected.</p>
          )}
          {ai.source !== 'gemini' && (
            <p className="mt-3 text-[11px] text-slate-500">Gemini AI is not configured — pattern matching was used instead.</p>
          )}
        </SourceCard>

        <SourceCard
          title={`Links in the message (${links.length})`}
          status={links.length === 0 ? 'ok' : links.some((l) => l.verdict === 'dangerous') ? 'danger' : links.some((l) => l.verdict === 'suspicious') ? 'warn' : 'ok'}
          statusLabel={links.length === 0 ? 'None found' : undefined}
          delay={0.2}
        >
          {links.length === 0 ? (
            <p className="text-xs text-slate-400">The message contains no links. Scammers often ask you to call or WhatsApp instead.</p>
          ) : (
            <ul className="space-y-2">
              {links.map((l) => {
                const v = VERDICTS[l.verdict];
                return (
                  <li key={l.url} className="rounded-lg bg-white/[0.03] p-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-slate-200" title={l.url}>{l.url}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 font-semibold ${v.bg} ${v.text}`}>{l.threatScore} · {v.label}</span>
                    </div>
                    <p className="mt-1 text-slate-400">{l.summary}</p>
                  </li>
                );
              })}
              <li className="text-[11px] text-slate-500">
                Each link was run through the full <Link to="/scan/url" className="text-cyber-cyan hover:underline">Link Scanner</Link>.
              </li>
            </ul>
          )}
        </SourceCard>
      </div>
    </div>
  );
}
