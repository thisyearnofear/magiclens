'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Cloth-simulation homage (2D version): a flag image displaced by animated
 * SVG turbulence — waves like fabric. Drifts slowly over the hero.
 * Full WebGPU cloth (domgl-cloth) stays the L-effort upgrade path.
 */
export function WavingFlag({
  src,
  className,
  driftDuration = 14,
  delay = 0,
}: {
  /** flag image URL — pack flag SVGs work great */
  src: string;
  className?: string;
  driftDuration?: number;
  delay?: number;
}) {
  const filterId = useId().replace(/:/g, 'flag-');

  return (
    <motion.div
      aria-hidden="true"
      initial={{ y: 0, rotate: -4 }}
      animate={{ y: [0, -18, 0], rotate: [-4, 3, -4] }}
      transition={{ duration: driftDuration, repeat: Infinity, ease: 'easeInOut', delay }}
      className={cn('pointer-events-none select-none', className)}
    >
      <svg viewBox="0 0 160 100" className="h-full w-full overflow-visible">
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            {/* Animated turbulence = cloth ripple. The displacement scale is
                modest so the flag still reads as a flag. */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.05"
              numOctaves="2"
              seed="3"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur={`${driftDuration / 2}s`}
                values="0.012 0.05;0.016 0.065;0.012 0.05"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="14"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <image
          href={src}
          x="4"
          y="4"
          width="152"
          height="92"
          preserveAspectRatio="xMidYMid meet"
          filter={`url(#${filterId})`}
        />
      </svg>
    </motion.div>
  );
}
