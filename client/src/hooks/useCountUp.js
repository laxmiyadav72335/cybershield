/**
 * Animates a number from 0 → target using requestAnimationFrame.
 * Honours prefers-reduced-motion (jumps straight to the value).
 */
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export function useCountUp(target, duration = 1400) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target == null) return undefined;
    // No animation for reduced-motion users, or when the tab is hidden
    // (requestAnimationFrame is paused there and the number would stick at 0)
    if (reduce || document.hidden) {
      const timer = setTimeout(() => setValue(target), 0);
      return () => clearTimeout(timer);
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduce]);

  return value;
}
