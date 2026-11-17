'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

/**
 * Codrops RotatingOnScrollAnimations-inspired: card tumbles in 3D
 * (rotateX/Y/Z + a sine depth dip) as it travels through the viewport.
 */
export function ScrollRotateCard({
  children,
  className,
  intensity = 1,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Mirrored rotation + depth dip at the midpoint, like upstream's
  // sin(progress * PI) * -50 z-nudge.
  const rx = useTransform(scrollYProgress, [0, 1], [55 * intensity, -55 * intensity]);
  const ry = useTransform(scrollYProgress, [0, 1], [-14 * intensity, 14 * intensity]);
  const rz = useTransform(scrollYProgress, [0, 1], [-10 * intensity, 10 * intensity]);
  const z = useTransform(scrollYProgress, (v) => Math.sin(v * Math.PI) * -60);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.3]);

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <div style={{ perspective: 1200 }} className={className}>
      <motion.div
        ref={ref}
        style={{
          rotateX: rx,
          rotateY: ry,
          rotateZ: rz,
          z,
          opacity,
          transformStyle: 'preserve-3d',
        }}
        className="h-full will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}
