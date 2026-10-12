import { motion } from 'framer-motion';
import Icon from '../ui/Icon';
import Button from '../ui/Button';

/** Friendly error panel (network down, rate limited, bad input…). */
export default function ScanError({ error, onRetry }) {
  if (!error) return null;
  const rateLimited = error.status === 429;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      className={`mt-5 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
        rateLimited ? 'border-suspicious/40 bg-suspicious/10' : 'border-danger/40 bg-danger/10'
      }`}
    >
      <Icon name="alert" className={`h-6 w-6 shrink-0 ${rateLimited ? 'text-suspicious' : 'text-danger'}`} />
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{rateLimited ? 'Please wait a moment' : 'Scan failed'}</p>
        <p className="mt-0.5 text-sm text-slate-300">{error.message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </motion.div>
  );
}
