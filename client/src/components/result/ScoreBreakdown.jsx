import { motion } from 'framer-motion';
import Icon from '../ui/Icon';

/** "Why this score?" — the weighted signals from the threat score engine. */
export default function ScoreBreakdown({ breakdown = [], score, reason = 'No score is available.' }) {
  if (score == null) return (
    <div>
      <h3 className="text-sm font-semibold text-white">Why no score?</h3>
      <p className="mt-2 text-sm text-slate-300">{reason}</p>
    </div>
  );
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">Why this score?</h3>
      {breakdown.length === 0 ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-safe">
          <Icon name="check" className="h-4 w-4" />
          No risk signals were triggered.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {breakdown.map((b, i) => (
            <motion.li
              key={b.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2 text-sm"
            >
              <span className="text-slate-300">{b.label}</span>
              <span className="shrink-0 font-mono text-xs font-semibold text-suspicious">+{b.points}</span>
            </motion.li>
          ))}
          <li className="flex items-center justify-between border-t border-white/10 px-3 pt-2 text-sm font-semibold">
            <span className="text-slate-200">Total (capped at 100)</span>
            <span className="font-mono text-white">{score}</span>
          </li>
        </ul>
      )}
    </div>
  );
}
