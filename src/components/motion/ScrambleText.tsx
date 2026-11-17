'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const GLYPHS = '!<>-_\\/[]{}=+*^?#0123456789abcdef';

/**
 * Codrops AnimatedCodeBackground-inspired decrypt effect (DOM version).
 * Characters scramble on hover/focus, then lock back one by one in a
 * scattered order. Perfect for tx hashes, wallet addresses, on-chain ids.
 */
export function ScrambleText({
  text,
  className,
  /** ms per scramble tick */
  rate = 28,
  /** also scramble once when the element mounts/scrolls in */
  onReveal = false,
}: {
  text: string;
  className?: string;
  rate?: number;
  onReveal?: boolean;
}) {
  const [display, setDisplay] = useState(text);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const scramble = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (timer.current) clearInterval(timer.current);

    // Each character locks at its own threshold → scattered resolve order
    const thresholds = text.split('').map((_, i) => i + Math.random() * text.length * 0.8);
    const max = Math.max(...thresholds) + 1;
    let tick = 0;

    timer.current = setInterval(() => {
      tick += 1;
      setDisplay(
        text
          .split('')
          .map((ch, i) => {
            if (ch === ' ' || ch === '.' || tick >= thresholds[i] + 4) return ch;
            if (tick >= thresholds[i]) return ch;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join('')
      );
      if (tick >= max + 4) {
        if (timer.current) clearInterval(timer.current);
        setDisplay(text);
      }
    }, rate);
  }, [text, rate]);

  useEffect(() => {
    if (onReveal) scramble();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line
  }, [text]);

  return (
    <span
      onMouseEnter={scramble}
      onFocus={scramble}
      className={cn('font-mono tabular-nums', className)}
    >
      {display}
    </span>
  );
}
