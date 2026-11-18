'use client';

import { motion } from 'framer-motion';

interface LockOnReticleProps {
  /** Subject bounding box in container px */
  box: { x: number; y: number; w: number; h: number };
}

/**
 * Plays once when pose tracking resolves: corner brackets converge from an
 * expanded ring onto the subject's bounding box, then a center flash.
 * Parent unmounts after ~1.4s.
 */
export function LockOnReticle({ box }: LockOnReticleProps) {
  const pad = 48; // brackets start this far outside the box
  const corners: { k: string; x: number; y: number; dx: number; dy: number; rot: number }[] = [
    { k: 'tl', x: box.x, y: box.y, dx: -pad, dy: -pad, rot: 0 },
    { k: 'tr', x: box.x + box.w, y: box.y, dx: pad, dy: -pad, rot: 90 },
    { k: 'br', x: box.x + box.w, y: box.y + box.h, dx: pad, dy: pad, rot: 180 },
    { k: 'bl', x: box.x, y: box.y + box.h, dx: -pad, dy: pad, rot: 270 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* expanding scan ring */}
      <motion.div
        className="absolute rounded-lg border-2 border-purple-400/60"
        initial={{ x: box.x - pad, y: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2, opacity: 0.9 }}
        animate={{ x: box.x, y: box.y, width: box.w, height: box.h, opacity: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
      {/* converging corner brackets */}
      {corners.map(c => (
        <motion.svg
          key={c.k}
          width="26" height="26" viewBox="0 0 26 26"
          className="absolute"
          initial={{ x: c.x - 13 + c.dx, y: c.y - 13 + c.dy, opacity: 0, rotate: c.rot }}
          animate={{ x: c.x - 13, y: c.y - 13, opacity: 1, rotate: c.rot }}
          transition={{ duration: 0.55, ease: [0.2, 0.9, 0.3, 1.1] }}
        >
          <path d="M2 24 V8 Q2 2 8 2 H24" fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" />
        </motion.svg>
      ))}
      {/* center flash */}
      <motion.div
        className="absolute rounded-full bg-purple-300/80"
        style={{ left: box.x + box.w / 2, top: box.y + box.h / 2 }}
        initial={{ width: 6, height: 6, x: -3, y: -3, opacity: 0 }}
        animate={{ width: 46, height: 46, x: -23, y: -23, opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
      />
    </div>
  );
}
