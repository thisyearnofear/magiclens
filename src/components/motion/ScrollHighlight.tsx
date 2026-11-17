'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Codrops OnScrollTextHighlight-inspired marker swipe.
 * A highlighter bar sweeps behind the text as it scrolls into view.
 */
export function ScrollHighlight({
  children,
  className,
  color = 'rgba(250,204,21,0.32)',
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });

  return (
    <span ref={ref} className={cn('relative inline-block px-1', className)}>
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 -z-10 origin-left skew-x-[-8deg] rounded-sm"
        style={{ background: color }}
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      />
      {children}
    </span>
  );
}
