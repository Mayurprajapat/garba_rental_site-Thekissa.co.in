import { motion, useMotionTemplate, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { useCoarsePointer } from './Tilt';

interface VortexProps {
  index?: number;
  strength?: number;
  className?: string;
  children: ReactNode;
}

/**
 * 3D Tornado / Spiral Vortex scroll entry — wraps ANY card.
 * Scroll-scrubbed: chhota + ghooma + blur se center me sharp settle.
 * Alternate sides, spring smoothing, perspective 1200.
 */
export default function Vortex({ index = 0, strength = 1, className = '', children }: VortexProps) {
  const reduce = useReducedMotion();
  const coarse = useCoarsePointer();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start center'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 110, damping: 24, mass: 0.6 });

  const dir = index % 2 === 0 ? -1 : 1;
  const scale = useTransform(smooth, [0, 0.55, 1], [0.2, 0.9, 1]);
  const x = useTransform(smooth, [0, 1], [120 * dir * strength, 0]);
  const y = useTransform(smooth, [0, 1], [70, 0]);
  const rotateY = useTransform(smooth, [0, 1], [55 * dir, 0]);
  const rotateZ = useTransform(smooth, [0, 1], [-14 * dir, 0]);
  const opacity = useTransform(smooth, [0, 0.4, 1], [0, 1, 1]);
  const blurV = useTransform(smooth, [0, 1], [4, 0]);
  const filter = useMotionTemplate`blur(${blurV}px)`;

  if (reduce || coarse) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ scale, x, y, rotateY, rotateZ, opacity, filter, transformPerspective: 1200, willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  );
}
