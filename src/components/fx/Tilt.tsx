import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(pointer: coarse)');
    if (!mq) return;
    const fn = (e: MediaQueryListEvent) => setCoarse(e.matches);
    mq.addEventListener?.('change', fn);
    return () => mq.removeEventListener?.('change', fn);
  }, []);
  return coarse;
}

interface TiltProps {
  children: ReactNode;
  max?: number;
  scale?: number;
  glare?: boolean;
  glareMax?: number;
  className?: string;
}

/**
 * 3D Parallax Card — cursor-follow tilt + spotlight glare + translateZ depth layers.
 * Phone / reduced-motion par plain div (smooth scroll).
 */
export default function Tilt({ children, max = 9, scale = 1.02, glare = true, glareMax = 0.26, className = '' }: TiltProps) {
  const reduce = useReducedMotion();
  const coarse = useCoarsePointer();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useTransform(my, [0, 1], [max, -max]);
  const rotateY = useTransform(mx, [0, 1], [-max, max]);
  const sc = useMotionValue(1);

  const gx = useTransform(mx, (v) => v * 100);
  const gy = useTransform(my, (v) => v * 100);
  const glareBg = useMotionTemplate`radial-gradient(520px circle at ${gx}% ${gy}%, rgba(255,255,255,${glareMax}), transparent 55%)`;
  const glareO = useMotionValue(0);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    my.set(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  }, [mx, my]);

  const onEnter = useCallback(() => {
    animate(glareO, 1, { duration: 0.25, ease: 'easeOut' });
    animate(sc, scale, { duration: 0.25, ease: 'easeOut' });
  }, [glareO, sc, scale]);

  const onLeave = useCallback(() => {
    animate(mx, 0.5, { duration: 0.5, ease: 'easeOut' });
    animate(my, 0.5, { duration: 0.5, ease: 'easeOut' });
    animate(glareO, 0, { duration: 0.5, ease: 'easeOut' });
    animate(sc, 1, { duration: 0.5, ease: 'easeOut' });
  }, [mx, my, glareO, sc]);

  if (reduce || coarse) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ rotateX, rotateY, scale: sc, transformStyle: 'preserve-3d' }}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{ background: glareBg, opacity: glareO }}
        />
      )}
    </motion.div>
  );
}

Tilt.Layer = function Layer({ z = 30, className = '', children }: { z?: number; className?: string; children: ReactNode }) {
  return (
    <div className={className} style={{ transform: `translateZ(${z}px)` }}>
      {children}
    </div>
  );
};
