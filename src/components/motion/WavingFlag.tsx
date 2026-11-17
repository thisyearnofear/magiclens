'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Cloth-simulation homage (2D version): a striped pennant drawn in SVG and
 * displaced by animated turbulence — waves like fabric. Drifts over the hero.
 * Full WebGPU cloth (domgl-cloth) stays the L-effort upgrade path.
 */
export function WavingFlag({
  colors = ['#facc15', '#0a0a0a', '#facc15'],
  className,
  driftDuration = 14,
  delay = 0,
}: {
  /** horizontal stripes, top → bottom */
  colors?: string[];
  className?: string;
  driftDuration?: number;
  delay?: number;
}) {
  const filterId = useId().replace(/:/g, 'flag-');
  const H = 100;
  const stripe = H / colors.length;

  return (
    <motion.div
      aria-hidden="true"
      initial={{ y: 0, rotate: -4 }}
      animate={{ y: [0, -18, 0], rotate: [-4, 3, -4] }}
      transition={{ duration: driftDuration, repeat: Infinity, ease: 'easeInOut', delay }}
      className={cn('pointer-events-none select-none', className)}
    >
      <svg viewBox="-10 -10 180 120" className="h-full w-full overflow-visible">
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            {/* Animated turbulence = cloth ripple. Modest scale so the flag
                still reads as a flag. */}
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
              scale="16"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          {/* Soft top-light so the cloth has some sheen */}
          <linearGradient id={`${filterId}-sheen`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <g filter={`url(#${filterId})`}>
          {colors.map((c, i) => (
            <rect key={i} x="0" y={i * stripe} width="160" height={stripe + 1} fill={c} />
          ))}
          <rect x="0" y="0" width="160" height={H} fill={`url(#${filterId}-sheen)`} />
        </g>
      </svg>
    </motion.div>
  );
}
