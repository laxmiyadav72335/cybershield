import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Icon from '../ui/Icon';
import { STATUS_LINES } from './statusLines';

/**
 * Full-screen radar overlay shown while a scan is running.
 * - Rotating conic sweep + concentric rings + pulsing "contact" dots
 * - Status lines tick in one by one ("Checking 70+ antivirus engines…")
 * Status lines are purely cosmetic pacing; the real work happens in the API call.
 */

export default function RadarScan({ lines = STATUS_LINES.url, title = 'Scanning', subtitle, intervalMs = 900 }) {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done >= lines.length) return undefined;
    const t = setTimeout(() => setDone((d) => d + 1), intervalMs);
    return () => clearTimeout(t);
  }, [done, lines.length, intervalMs]);

  const dots = [
    { x: 32, y: 28, d: 0 },
    { x: 68, y: 40, d: 0.6 },
    { x: 55, y: 72, d: 1.2 },
    { x: 24, y: 60, d: 1.8 },
  ];

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-900/85 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.94, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="glass w-full max-w-lg rounded-3xl p-6 sm:p-8"
      >
        <div className="grid items-center gap-6 sm:grid-cols-[200px_1fr]">
          {/* Radar */}
          <div className="relative mx-auto aspect-square w-48">
            <div className="absolute inset-0 rounded-full border border-cyber-cyan/30" />
            <div className="absolute inset-[22%] rounded-full border border-cyber-cyan/25" />
            <div className="absolute inset-[44%] rounded-full border border-cyber-cyan/20" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-cyber-cyan/15" />
            <div className="absolute top-1/2 left-0 h-px w-full bg-cyber-cyan/15" />
            {/* Sweep */}
            <div
              className="absolute inset-0 rounded-full [background:conic-gradient(from_0deg,rgba(34,211,238,0.55)_0deg,rgba(34,211,238,0.12)_50deg,transparent_80deg)]"
              style={{ animation: reduce ? 'none' : 'spin 2s linear infinite' }}
            />
            {/* Contacts */}
            {dots.map((p, i) => (
              <span
                key={i}
                className="absolute h-2 w-2 rounded-full bg-cyber-cyan shadow-[0_0_12px_#22D3EE]"
                style={{ left: `${p.x}%`, top: `${p.y}%`, animation: reduce ? 'none' : `pulse-slow 2s ease-in-out ${p.d}s infinite` }}
              />
            ))}
            <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_#fff]" />
          </div>

          {/* Status */}
          <div>
            <p className="font-display text-lg font-bold text-white">
              {title}
              <span className="inline-block w-6 text-left text-cyber-cyan">
                <Dots />
              </span>
            </p>
            {subtitle && <p className="mt-1 truncate text-xs text-slate-400">{subtitle}</p>}
            <ul className="mt-4 space-y-2 font-mono text-xs">
              <AnimatePresence initial={false}>
                {lines.slice(0, done + 1).map((line, i) => {
                  const finished = i < done;
                  return (
                    <motion.li
                      key={line}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-start gap-2 ${finished ? 'text-slate-400' : 'text-cyber-cyan'}`}
                    >
                      {finished ? (
                        <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-safe" />
                      ) : (
                        <span className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-cyber-cyan" />
                      )}
                      {line}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Dots() {
  const [n, setN] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setN((v) => (v % 3) + 1), 400);
    return () => clearInterval(t);
  }, []);
  return '.'.repeat(n);
}
