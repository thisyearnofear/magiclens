'use client';
import { motion } from 'framer-motion';

type Mood = 'idle' | 'happy' | 'waving' | 'thinking' | 'celebrate';

export function MascotCharacter({ mood = 'idle', size = 80 }: { mood?: Mood; size?: number }) {
  const pulseAnim = mood === 'idle' ? { scale: [1, 1.03, 1] } : {};
  const waveAnim = mood === 'waving' ? { rotate: [0, -15, 15, -10, 10, -5, 5, 0] } : {};
  const bounceAnim = mood === 'happy' || mood === 'celebrate' ? { y: [0, -6, 0] } : {};
  const thinkAnim = mood === 'thinking' ? { rotate: [0, -5, 0, 5, 0] } : {};

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      animate={{ ...pulseAnim, ...waveAnim, ...bounceAnim, ...thinkAnim }}
      transition={{ duration: mood === 'waving' ? 1.2 : 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Lens body */}
      <defs>
        <radialGradient id="lensGrad" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="70%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#5b21b6" />
        </radialGradient>
        <radialGradient id="glareGrad" cx="35%" cy="30%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Outer ring */}
      <circle cx="50" cy="50" r="48" fill="url(#lensGrad)" stroke="#9333ea" strokeWidth="2" />

      {/* Inner glow */}
      <motion.circle
        cx="50" cy="50" r="44"
        fill="url(#glareGrad)"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Lens reflection arc */}
      <motion.path
        d="M 22 30 Q 35 18 55 22"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />

      {/* Eyes */}
      <motion.g
        animate={mood === 'happy' ? { scaleY: 0.3, y: 5 } : mood === 'celebrate' ? { scaleY: 0.3, y: 5 } : {}}
        transition={{ duration: 0.3 }}
      >
        {/* Left eye */}
        <circle cx="36" cy="42" r="6" fill="white" />
        <motion.circle
          cx="37" cy="42" r="3" fill="#1e1b4b"
          animate={mood === 'thinking' ? { x: [0, 2, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <circle cx="39" cy="40" r="1.2" fill="white" />

        {/* Right eye */}
        <circle cx="64" cy="42" r="6" fill="white" />
        <motion.circle
          cx="65" cy="42" r="3" fill="#1e1b4b"
          animate={mood === 'thinking' ? { x: [0, -2, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <circle cx="67" cy="40" r="1.2" fill="white" />
      </motion.g>

      {/* Smile */}
      <motion.path
        d={mood === 'happy' || mood === 'celebrate'
          ? 'M 38 62 Q 50 74 62 62'
          : mood === 'thinking'
          ? 'M 40 60 Q 50 65 60 60'
          : 'M 40 58 Q 50 66 60 58'
        }
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Blush marks (visible when happy) */}
      {(mood === 'happy' || mood === 'celebrate') && (
        <>
          <motion.ellipse cx="28" cy="55" rx="5" ry="3" fill="#f472b6" opacity={0.4}
            animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.ellipse cx="72" cy="55" rx="5" ry="3" fill="#f472b6" opacity={0.4}
            animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
        </>
      )}

      {/* Small sparkle near head */}
      {mood === 'celebrate' && (
        <motion.g
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <text x="78" y="22" fontSize="14" fill="#fbbf24">✦</text>
        </motion.g>
      )}

      {/* Arms */}
      <motion.g
        animate={mood === 'waving' ? { transform: 'rotate(-20 22 50)' } : {}}
        transition={{ duration: 0.3 }}
      >
        <line x1="8" y1="52" x2="18" y2="50" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" />
      </motion.g>
      <line x1="92" y1="52" x2="82" y2="50" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" />
    </motion.svg>
  );
}
