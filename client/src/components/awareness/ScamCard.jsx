import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../ui/Icon';

/** Expandable card for one scam type. */
export default function ScamCard({ scam, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `scam-${scam.id}`;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      className="glass overflow-hidden rounded-2xl"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1"
          style={{ color: scam.accent, background: `${scam.accent}1A`, '--tw-ring-color': `${scam.accent}55` }}
        >
          <Icon name={scam.icon} className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold text-white">{scam.title}</span>
          <span className="block truncate text-sm text-slate-400">{scam.tagline}</span>
        </span>
        <Icon name="arrow" className={`h-5 w-5 shrink-0 text-cyber-cyan transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-white/5 px-5 pb-6 pt-5">
              <section>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-cyber-cyan">How it works</h4>
                <p className="text-sm leading-relaxed text-slate-300">{scam.how}</p>
              </section>

              <section>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-cyber-cyan">Real-world example</h4>
                <blockquote className="rounded-xl border-l-2 border-suspicious bg-bg-900/60 px-4 py-3 font-mono text-xs leading-relaxed text-slate-200">
                  {scam.example}
                </blockquote>
              </section>

              <div className="grid gap-5 md:grid-cols-2">
                <section>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-danger">Red flags</h4>
                  <ul className="space-y-1.5">
                    {scam.redFlags.map((f) => (
                      <li key={f} className="flex gap-2 text-sm text-slate-300">
                        <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-safe">What to do</h4>
                  <ul className="space-y-1.5">
                    {scam.doThis.map((d) => (
                      <li key={d} className="flex gap-2 text-sm text-slate-300">
                        <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
