import { motion } from 'framer-motion';
import Icon from '../ui/Icon';

/**
 * One card per data source (Safe Browsing, VirusTotal, …).
 * status: 'ok' | 'warn' | 'danger' | 'unavailable' | 'pending'
 */
const STATUS = {
  ok: { icon: 'check', cls: 'text-safe', ring: 'ring-safe/30', label: 'Clean' },
  warn: { icon: 'alert', cls: 'text-suspicious', ring: 'ring-suspicious/40', label: 'Warning' },
  danger: { icon: 'alert', cls: 'text-danger', ring: 'ring-danger/50', label: 'Threat' },
  unavailable: { icon: 'close', cls: 'text-slate-500', ring: 'ring-white/10', label: 'Unavailable' },
  pending: { icon: 'bolt', cls: 'text-cyber-cyan', ring: 'ring-cyber-cyan/40', label: 'In progress' },
};

export default function SourceCard({ title, status = 'ok', statusLabel, children, delay = 0 }) {
  const s = STATUS[status] || STATUS.ok;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`glass rounded-2xl p-5 ring-1 ${s.ring}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium ${s.cls}`}>
          <Icon name={s.icon} className="h-3.5 w-3.5" strokeWidth={2.4} />
          {statusLabel || s.label}
        </span>
      </div>
      <div className="text-sm text-slate-300">{children}</div>
    </motion.div>
  );
}

/** key / value row used inside SourceCard */
export function Row({ k, v, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-white/5 py-1.5 text-xs first:border-t-0">
      <span className="min-w-0 text-slate-500">{k}</span>
      <span className={`min-w-0 max-w-[65%] text-right text-slate-200 [overflow-wrap:anywhere] ${mono ? 'font-mono' : ''}`}>{v ?? '—'}</span>
    </div>
  );
}
