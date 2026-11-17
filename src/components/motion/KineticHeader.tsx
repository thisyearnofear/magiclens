'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Codrops TextCharacterAnimations-inspired split header.
 * Each character rises + un-rotates with a spring stagger when scrolled in.
 * Extends the KineticHeroTitle treatment to any section title.
 */
export function KineticHeader({
  text,
  className,
  charClassName,
  stagger = 0.03,
  as: Tag = 'span',
}: {
  text: string;
  className?: string;
  charClassName?: string;
  stagger?: number;
  as?: 'span' | 'h1' | 'h2' | 'h3';
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduced = useReducedMotion();

  const chars = (
    <span ref={ref} aria-label={text} role="text" className="inline-block">
      {text.split('').map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          aria-hidden="true"
          initial={reduced ? false : { y: '115%', rotate: 5, opacity: 0 }}
          animate={inView ? { y: '0%', rotate: 0, opacity: 1 } : {}}
          transition={{
            delay: 0.05 + stagger * i,
            type: 'spring',
            stiffness: 220,
            damping: 20,
          }}
          className={cn('inline-block will-change-transform', charClassName)}
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </span>
  );

  return <Tag className={cn('overflow-hidden', className)}>{chars}</Tag>;
}
