'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

const KEY = 'magiclens:sound-enabled';

/**
 * Ferrofluid-inspired sound toggle: knob morphs toward state with spring.
 * Persists to localStorage; cohesive gold treatment.
 */
export function FerroSoundToggle({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v !== null) setEnabled(v === '1');
    } catch {}
  }, []);

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'Mute sounds' : 'Enable sounds'}
      className={cn(
        'relative flex h-7 w-12 items-center rounded-full border px-1 transition-colors',
        enabled ? 'border-yellow-400/50 bg-yellow-400/20' : 'border-white/15 bg-white/5',
        className
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-full',
          enabled ? 'ml-auto bg-yellow-400 text-black' : 'bg-white/20 text-gray-300'
        )}
      >
        {enabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
      </motion.span>
    </button>
  );
}

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}
