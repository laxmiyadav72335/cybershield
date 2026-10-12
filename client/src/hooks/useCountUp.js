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
    if (reduce) {
      setValue(target);
      return undefined;
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
