import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * Primary / secondary / ghost button. Renders a <Link> when `to` is given.
 * Uses motion for a subtle press effect (disabled under reduced motion by Framer).
 */
const styles = {
  primary:
    'bg-cyber-cyan text-bg-900 font-semibold shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:shadow-[0_0_36px_rgba(34,211,238,0.55)] hover:bg-cyan-300',
  secondary:
    'glass text-white hover:border-cyber-cyan/50 hover:text-cyber-cyan',
  ghost: 'text-slate-300 hover:text-white hover:bg-white/5',
  danger: 'bg-danger text-white hover:bg-red-400',
};

// Hoisted so React sees a stable component type (creating it inside render would remount on every update)
const MotionLink = motion.create(Link);

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  className = '',
  ...rest
}) {
  const base = `inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${sizes[size]} ${className}`;
  const MotionTag = to ? MotionLink : motion.button;
  return (
    <MotionTag whileTap={{ scale: 0.97 }} className={base} to={to} {...rest}>
      {children}
    </MotionTag>
  );
}
