import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { VERDICTS, verdictFromScore } from '../../config/scanners';

/**
 * Semi-circle "speedometer" threat gauge.
 * - Track arc with a green → amber → red gradient
 * - Progress arc + needle animate from 0 to `score` using a spring
 * - Number counts up and takes the verdict colour
 * Geometry: centre (100,100), radius 80 → arc from (20,100) to (180,100).
 * Needle angle = -90° (score 0) … +90° (score 100).
 */
export default function ThreatGauge({ score = 0, size = 280 }) {
  const reduce = useReducedMotion();
  const target = Math.max(0, Math.min(100, score));
  const raw = useMotionValue(reduce ? target : 0);
  const value = useSpring(raw, { stiffness: 60, damping: 16, mass: 0.8 });

  useEffect(() => {
    raw.set(target);
  }, [target, raw]);

  // Needle angle is applied as a native SVG transform (rotate(a cx cy)) so the
  // pivot is exactly the hub at (100,100). Framer's CSS rotate would pivot
  // around the needle's own bounding box instead.
  const [angle, setAngle] = useState(reduce ? -90 + target * 1.8 : -90);
  useMotionValueEvent(value, 'change', (v) => setAngle(-90 + v * 1.8));
  const progress = useTransform(value, [0, 100], [0, 1]);
  const display = useTransform(value, (v) => Math.round(v));
  const color = useTransform(value, (v) => VERDICTS[verdictFromScore(v)].color);
  const verdict = VERDICTS[verdictFromScore(target)];

  return (
    <div className="relative mx-auto flex flex-col" style={{ width: size, maxWidth: '100%' }}>
      <svg viewBox="0 0 200 118" className="w-full overflow-visible" role="img" aria-label={`Threat score ${target} out of 100, ${verdict.label}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" />
        {/* Gradient ghost of the track (dim) */}
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round" opacity="0.22" />
        {/* Animated progress */}
        <motion.path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          filter="url(#gaugeGlow)"
          style={{ pathLength: progress }}
        />

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((t) => {
          const a = ((-90 + t * 1.8) * Math.PI) / 180;
          const x1 = 100 + Math.sin(a) * 64;
          const y1 = 100 - Math.cos(a) * 64;
          const x2 = 100 + Math.sin(a) * 58;
          const y2 = 100 - Math.cos(a) * 58;
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />;
        })}
        <text x="20" y="114" fontSize="8" fill="#94A3B8" textAnchor="middle">0</text>
        <text x="100" y="14" fontSize="8" fill="#94A3B8" textAnchor="middle">50</text>
        <text x="180" y="114" fontSize="8" fill="#94A3B8" textAnchor="middle">100</text>

        {/* Needle */}
        <g transform={`rotate(${angle} 100 100)`}>
          <path d="M100 100 L96 100 L100 36 L104 100 Z" fill="#E2E8F0" />
          <path d="M100 100 L97.5 100 L100 40 L102.5 100 Z" fill="#fff" />
        </g>
        <circle cx="100" cy="100" r="7" fill="#0f172a" stroke="#E2E8F0" strokeWidth="2" />
        <motion.circle cx="100" cy="100" r="3" style={{ fill: color }} />
      </svg>

      {/* Score readout sits below the hub so the needle never crosses it */}
      <div className="pointer-events-none -mt-1 flex flex-col items-center">
        <motion.span className="font-display text-5xl font-bold leading-none" style={{ color }}>
          {display}
        </motion.span>
        <span className="mt-1.5 text-[11px] uppercase tracking-[0.25em] text-slate-400">Threat score</span>
      </div>
    </div>
  );
}
