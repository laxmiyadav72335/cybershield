import { motion } from 'framer-motion';

/** Consistent page title block: eyebrow label + heading + optional subtitle. */
export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyber-cyan">{eyebrow}</p>
        )}
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}
