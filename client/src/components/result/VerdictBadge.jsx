import { motion } from 'framer-motion';
import { VERDICTS } from '../../config/scanners';
import Icon from '../ui/Icon';

const icons = { safe: 'check', suspicious: 'alert', dangerous: 'alert' };

/** Big pill showing Safe / Suspicious / Dangerous. */
export default function VerdictBadge({ verdict = 'safe', size = 'lg' }) {
  const v = VERDICTS[verdict] || VERDICTS.safe;
  const pad = size === 'lg' ? 'px-5 py-2.5 text-base' : 'px-3 py-1 text-xs';
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.3 }}
      className={`inline-flex items-center gap-2 rounded-full font-semibold ring-1 ${v.bg} ${v.text} ${v.ring} ${pad}`}
      style={{ boxShadow: `0 0 24px ${v.color}55` }}
    >
      <Icon name={icons[verdict]} className={size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5'} strokeWidth={2.4} />
      {v.label}
    </motion.span>
  );
}
