'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Codrops scroll-typography inspired divider: a micro mono label that scales
 * into a viewport-filling word with chromatic edges as you scroll past.
 */
export function GiantTypeDivider({
  word,
  label,
  className,
}: {
  word: string;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0.05, 0.5, 0.95], [0.35, 1, 1.35]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
  const tracking = useTransform(scrollYProgress, [0.05, 0.5], ['0.4em', '0em']);

  // Chromatic ghost layers trailing the front word
  const ghostX = useTransform(scrollYProgress, [0.1, 0.5], [24, 0]);
  const ghostNeg = useTransform(ghostX, (v) => -v);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('relative flex select-none flex-col items-center justify-center overflow-hidden py-16 sm:py-24', className)}
    >
      {label && (
        <div className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.35em] text-gray-500">
          {label}
        </div>
      )}
      <div className="relative">
        {!reduced && (
          <>
            <motion.span
              style={{ x: ghostX, scale, opacity }}
              className="absolute inset-0 font-display text-[18vw] font-bold leading-none text-fuchsia-500/30 sm:text-[14vw]"
            >
              {word}
            </motion.span>
            <motion.span
              style={{ x: ghostNeg, scale, opacity }}
              className="absolute inset-0 font-display text-[18vw] font-bold leading-none text-cyan-400/30 sm:text-[14vw]"
            >
              {word}
            </motion.span>
          </>
        )}
        <motion.span
          style={reduced ? undefined : { scale, opacity, letterSpacing: tracking }}
          className="relative font-display text-[18vw] font-bold leading-none text-white/95 sm:text-[14vw]"
        >
          {word}
        </motion.span>
      </div>
    </div>
  );
}
