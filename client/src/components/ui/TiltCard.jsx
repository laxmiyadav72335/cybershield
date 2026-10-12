import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

/**
 * 3D tilt-on-hover wrapper used by the Home scanner cards.
 * Mouse position → rotateX / rotateY motion values → spring-smoothed.
 * A radial "spotlight" follows the cursor for extra depth.
 */
export default function TiltCard({ children, className = '', maxTilt = 10 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(y, [0, 1], [maxTilt, -maxTilt]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-maxTilt, maxTilt]), { stiffness: 200, damping: 20 });
  const spotX = useTransform(x, [0, 1], ['0%', '100%']);
  const spotY = useTransform(y, [0, 1], ['0%', '100%']);

  const onMove = (e) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width);
    y.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: reduce ? 0 : rotateX, rotateY: reduce ? 0 : rotateY, transformStyle: 'preserve-3d' }}
      className={`relative [perspective:1000px] ${className}`}
    >
      {/* Cursor spotlight */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [spotX, spotY],
            ([sx, sy]) => `radial-gradient(360px circle at ${sx} ${sy}, rgba(34,211,238,0.16), transparent 60%)`,
          ),
        }}
      />
      <div style={{ transform: 'translateZ(24px)' }}>{children}</div>
    </motion.div>
  );
}
