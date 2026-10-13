import { SCAMS, HELPLINES } from '../config/scams';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import Icon from '../components/ui/Icon';
import ScamCard from '../components/awareness/ScamCard';
import Quiz from '../components/awareness/Quiz';

/** Scam awareness: 7 common Indian scams + helplines + 10-question quiz. */
export default function Awareness() {
  return (
    <div className="py-10">
      <PageHeader
        eyebrow="Awareness"
        title="Know the scams before they know you"
        subtitle="The most common frauds targeting people in India, how they work, and what to do. Then test yourself with the quiz."
      />

      {/* Golden rules */}
      <GlassCard glow className="mb-8 p-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-cyber-cyan">
          <Icon name="shield" className="h-4 w-4" /> Four golden rules
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Never share an OTP, PIN or CVV', 'with anyone, for any reason — not even "to cancel".'],
            ['Receiving money never needs a scan or PIN', 'A QR code or PIN request always means you are paying.'],
            ['Urgency is the weapon', 'Deadlines like "today" or "within 1 hour" exist to stop you thinking.'],
            ['Go to the source yourself', 'Open the official app or call the number on your card — never the link or number in the message.'],
          ].map(([t, d]) => (
            <li key={t} className="rounded-xl bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">{t}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{d}</p>
            </li>
          ))}
        </ul>
      </GlassCard>

      {/* Scam cards */}
      <section aria-labelledby="scams-heading" className="mb-12">
        <h2 id="scams-heading" className="mb-4 font-display text-xl font-bold">Common scams in India</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {SCAMS.map((s, i) => <ScamCard key={s.id} scam={s} defaultOpen={i === 0} />)}
        </div>
      </section>

      {/* Helplines */}
      <section aria-labelledby="help-heading" className="mb-12">
        <h2 id="help-heading" className="mb-4 font-display text-xl font-bold">If it already happened</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HELPLINES.map((h) => (
            <GlassCard key={h.label} className="p-5">
              <p className="text-[11px] uppercase tracking-wider text-slate-400">{h.label}</p>
              {h.href ? (
                <a href={h.href} target="_blank" rel="noreferrer" className="mt-1 block font-display text-lg font-bold text-cyber-cyan hover:underline">{h.value} ↗</a>
              ) : (
                <p className="mt-1 font-display text-2xl font-bold text-white">{h.value}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">{h.note}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Quiz */}
      <section aria-labelledby="quiz-heading">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="quiz-heading" className="font-display text-xl font-bold">Test yourself: 10-question quiz</h2>
          <span className="text-xs text-slate-500">Instant feedback after each answer</span>
        </div>
        <div className="mx-auto max-w-3xl">
          <Quiz />
        </div>
      </section>
    </div>
  );
}
