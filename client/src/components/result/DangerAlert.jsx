import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * When a verdict is Dangerous: the screen edges glow red (pulsing for a few
 * seconds, then settling to a faint vignette) and the page shakes once.
 * Shake is skipped under prefers-reduced-motion.
 */
export default function DangerAlert() {
  const reduce = useReducedMotion();
  const [intense, setIntense] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIntense(false), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30"
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        boxShadow: intense && !reduce
          ? ['inset 0 0 60px 10px rgba(239,68,68,0.15)', 'inset 0 0 140px 40px rgba(239,68,68,0.55)', 'inset 0 0 60px 10px rgba(239,68,68,0.15)']
          : 'inset 0 0 90px 20px rgba(239,68,68,0.28)',
      }}
      transition={intense && !reduce ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.8 }}
    />
  );
}
