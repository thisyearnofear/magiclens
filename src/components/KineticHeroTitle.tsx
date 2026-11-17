'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

/**
 * Codrops kinetic-type hero: oversized MAGICLENS wordmark with
 * staggered letter rise + scroll-linked drift + hover skew.
 * Cohesive with gold caustic + cursor glow (same gold, same springs).
 */
export function KineticHeroTitle({ text = 'MAGICLENS' }: { text?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.15]);
  const letterSpacing = useTransform(scrollYProgress, [0, 1], ['0.02em', '0.18em']);

  return (
    <div ref={ref} aria-label={text} className="select-none overflow-hidden">
      <motion.div style={{ y, opacity, letterSpacing }} className="flex justify-center">
        {text.split('').map((ch, i) => (
          <motion.span
            key={i}
            initial={{ y: '110%', rotate: 6 }}
            animate={{ y: '0%', rotate: 0 }}
            transition={{ delay: 0.05 * i + 0.1, type: 'spring', stiffness: 180, damping: 20 }}
            whileHover={{ skewX: -8, y: -6, color: '#fde68a' }}
            className="inline-block bg-gradient-to-b from-white via-yellow-100 to-yellow-400 bg-clip-text text-transparent font-black leading-[0.9] tracking-tight text-[clamp(3rem,12vw,9rem)]"
          >
            {ch}
          </motion.span>
        ))}
      </motion.div>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
        className="mx-auto mt-3 h-px w-2/3 origin-center bg-gradient-to-r from-transparent via-yellow-400/70 to-transparent"
      />
    </div>
  );
}
