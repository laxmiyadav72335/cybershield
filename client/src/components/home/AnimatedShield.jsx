import { motion, useReducedMotion } from 'framer-motion';

/**
 * Hero visual: a glowing shield with orbiting rings, a sweeping radar arc,
 * pulsing nodes and a drawn-in checkmark. Pure SVG + CSS/Framer animation.
 */
export default function AnimatedShield() {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      {/* Ambient glow */}
      <div className="absolute inset-[18%] rounded-full bg-cyber-cyan/20 blur-3xl" />

      {/* Rotating rings + orbiting nodes.
          Wrapped in a circular overflow-hidden box so the rotated square
          bounding boxes never cause horizontal scroll on narrow screens. */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-cyber-cyan/30" />
        <div className="absolute inset-[9%] animate-spin-reverse rounded-full border border-cyber-cyan/20" />
        <div className="absolute inset-[9%] animate-spin-slow rounded-full [background:conic-gradient(from_0deg,transparent_0deg,rgba(34,211,238,0.28)_60deg,transparent_90deg)]" />
        {[0, 120, 240].map((deg, i) => (
          <div
            key={deg}
            className="absolute inset-0 animate-spin-slow"
            style={{ animationDelay: `${-i * 4}s`, animationDuration: '12s' }}
          >
            <span className="absolute left-1/2 top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-cyber-cyan shadow-[0_0_14px_#22D3EE]" />
          </div>
        ))}
      </div>

      {/* Shield */}
      <motion.svg
        viewBox="0 0 200 220"
        className="absolute inset-[22%] animate-float drop-shadow-[0_0_30px_rgba(34,211,238,0.45)]"
        initial={reduce ? false : { scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        aria-label="CyberShield animated shield"
        role="img"
      >
        <defs>
          <linearGradient id="shieldFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#0a0f1f" />
          </linearGradient>
          <linearGradient id="shieldStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#67E8F9" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>
          <clipPath id="shieldClip">
            <path d="M100 8 L180 36 V104 C180 150 146 190 100 212 C54 190 20 150 20 104 V36 Z" />
          </clipPath>
        </defs>
        <path
          d="M100 8 L180 36 V104 C180 150 146 190 100 212 C54 190 20 150 20 104 V36 Z"
          fill="url(#shieldFill)"
          stroke="url(#shieldStroke)"
          strokeWidth="4"
        />
        {/* Inner grid */}
        <g clipPath="url(#shieldClip)" stroke="rgba(34,211,238,0.14)" strokeWidth="1">
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`v${i}`} x1={20 + i * 20} y1="0" x2={20 + i * 20} y2="220" />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 20} x2="200" y2={i * 20} />
          ))}
          {/* Scan beam */}
          {!reduce && (
            <motion.rect
              x="0"
              width="200"
              height="26"
              fill="url(#beam)"
              initial={{ y: -30 }}
              animate={{ y: 230 }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'linear', repeatDelay: 0.6 }}
            />
          )}
        </g>
        <defs>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,211,238,0)" />
            <stop offset="60%" stopColor="rgba(34,211,238,0.45)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>
        {/* Checkmark */}
        <motion.path
          d="M66 112 L90 136 L136 86"
          fill="none"
          stroke="#22D3EE"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, delay: 0.5, ease: 'easeOut' }}
        />
      </motion.svg>

      {/* Status chips */}
      <div className="absolute -left-2 top-[14%] hidden sm:block">
        <Chip label="Safe Browsing" color="safe" delay={0.9} />
      </div>
      <div className="absolute -right-4 top-[38%] hidden sm:block">
        <Chip label="70+ AV engines" color="cyan" delay={1.1} />
      </div>
      <div className="absolute left-[6%] bottom-[8%] hidden sm:block">
        <Chip label="AI explanation" color="violet" delay={1.3} />
      </div>
    </div>
  );
}

function Chip({ label, color, delay }) {
  const colors = {
    safe: 'text-safe border-safe/40 bg-safe/10',
    cyan: 'text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10',
    violet: 'text-violet-300 border-violet-400/40 bg-violet-400/10',
  };
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className={`glass inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${colors[color]}`}
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      {label}
    </motion.span>
  );
}
