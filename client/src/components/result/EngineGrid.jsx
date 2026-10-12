import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../ui/Icon';

const CATEGORY = {
  malicious: { dot: 'bg-danger', ring: 'ring-danger/50 bg-danger/10', text: 'text-danger', label: 'Malicious' },
  suspicious: { dot: 'bg-suspicious', ring: 'ring-suspicious/50 bg-suspicious/10', text: 'text-suspicious', label: 'Suspicious' },
  harmless: { dot: 'bg-safe', ring: 'ring-safe/30 bg-safe/5', text: 'text-safe', label: 'Clean' },
  undetected: { dot: 'bg-slate-500', ring: 'ring-white/10 bg-white/[0.03]', text: 'text-slate-400', label: 'Undetected' },
  timeout: { dot: 'bg-slate-600', ring: 'ring-white/5 bg-white/[0.02]', text: 'text-slate-500', label: 'Timeout' },
};
const style = (c) => CATEGORY[c] || CATEGORY.timeout;

/**
 * Grid of antivirus engine tiles that "light up" one after another.
 * Flagged engines are sorted first by the backend, so the red tiles appear
 * at the top and animate in first.
 */
export default function EngineGrid({ engines = [], stats }) {
  const [showAll, setShowAll] = useState(false);
  const LIMIT = 24;
  const visible = showAll ? engines : engines.slice(0, LIMIT);
  const flagged = (stats?.malicious || 0) + (stats?.suspicious || 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <Legend color="bg-danger" label={`${stats?.malicious ?? 0} malicious`} />
        <Legend color="bg-suspicious" label={`${stats?.suspicious ?? 0} suspicious`} />
        <Legend color="bg-safe" label={`${stats?.harmless ?? 0} clean`} />
        <Legend color="bg-slate-500" label={`${stats?.undetected ?? 0} undetected`} />
        <span className="ml-auto font-medium text-slate-300">
          {flagged} / {engines.length} engines flagged
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {visible.map((e, i) => {
          const s = style(e.category);
          return (
            <motion.li
              key={e.name}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i, LIMIT) * 0.04, duration: 0.25 }}
              title={e.result || s.label}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ring-1 ${s.ring}`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot} ${e.category === 'malicious' ? 'shadow-[0_0_8px_#EF4444]' : ''}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-slate-200">{e.name}</span>
                <span className={`block truncate text-[10px] ${s.text}`}>{e.result || s.label}</span>
              </span>
            </motion.li>
          );
        })}
      </ul>

      {engines.length > LIMIT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-cyber-cyan hover:underline"
        >
          {showAll ? 'Show fewer engines' : `Show all ${engines.length} engines`}
          <Icon name="arrow" className={`h-4 w-4 transition-transform ${showAll ? '-rotate-90' : 'rotate-90'}`} />
        </button>
      )}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-400">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
