'use client';

import { motion } from 'framer-motion';
import React from 'react';

/**
 * Hollow-tunnel-inspired CTA stage: concentric perspective rings behind content.
 * Pure CSS / framer, no WebGL — gives depth without cost.
 */
export function HollowStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-yellow-400/20 bg-gradient-to-r from-yellow-400/15 to-purple-500/15">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[420, 320, 230, 150].map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1 - i * 0.2, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.6 }}
            style={{ width: s, height: s }}
            className="absolute rounded-full border border-yellow-300/20"
          />
        ))}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
