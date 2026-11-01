import { animate, useInView, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_QUART = [0.22, 1, 0.36, 1] as const;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Counts a number up the first time its element is visible. Respects reduced motion. */
export function useCountUp(target: number, opts: { duration?: number; decimals?: number } = {}) {
  const { duration = 1.1, decimals = 2 } = opts;
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? target : 0);
  const [text, setText] = useState(() => format(reduce ? target : 0, decimals));

  useEffect(() => {
    const unsub = mv.on('change', (v) => setText(format(v, decimals)));
    return unsub;
  }, [mv, decimals]);

  useEffect(() => {
    if (reduce) {
      mv.set(target);
      return;
    }
    if (!inView) return;
    const controls = animate(mv, target, { duration, ease: EASE_OUT });
    return () => controls.stop();
  }, [target, inView, reduce, mv, duration]);

  return { ref, text };
}

function format(v: number, decimals: number) {
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export { useTransform };
