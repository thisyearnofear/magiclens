'use client';
import { motion } from 'framer-motion';

/**
 * Shared stadium backdrop with gooey animated blobs.
 * Renders as fixed layers behind all content (z-0 to z-[2]).
 * Pages should wrap their content in a relative z-[3] container.
 */
export function StadiumBackdrop({ opacity = 0.3 }: { opacity?: number }) {
  return (
    <>
      {/* Stadium background image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=80&auto=format)',
        }}
      />
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-br from-purple-950/90 via-blue-950/85 to-indigo-950/90" />

      {/* Gooey animated blobs */}
      <svg className="fixed inset-0 z-[2] w-full h-full pointer-events-none" style={{ opacity }} aria-hidden="true">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -20" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
        <g filter="url(#gooey)">
          <motion.circle
            cx="15%" cy="20%" r="120"
            fill="rgba(168,85,247,0.5)"
            animate={{ cx: ['15%', '25%', '15%'], cy: ['20%', '35%', '20%'], r: [120, 150, 120] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="80%" cy="25%" r="100"
            fill="rgba(59,130,246,0.4)"
            animate={{ cx: ['80%', '70%', '80%'], cy: ['25%', '40%', '25%'], r: [100, 130, 100] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          <motion.circle
            cx="50%" cy="70%" r="90"
            fill="rgba(250,204,21,0.25)"
            animate={{ cx: ['50%', '40%', '50%'], cy: ['70%', '55%', '70%'], r: [90, 120, 90] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          />
        </g>
      </svg>
    </>
  );
}
