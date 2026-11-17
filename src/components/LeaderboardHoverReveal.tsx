'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Trophy } from 'lucide-react';

export interface HoverEntry {
  tokenId: number;
  title: string;
  creator: string;
  votes: number;
  rank: number;
  reward?: string;
  color?: string;
}

/**
 * Codrops InlineHoverReveals-inspired floating preview.
 * Parent rows call setActive(entry | null); preview chases cursor with spring.
 */
export function LeaderboardHoverReveal({
  active,
  anchorRef,
}: {
  active: HoverEntry | null;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 28, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 300, damping: 28, mass: 0.4 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const offsetX = e.clientX > window.innerWidth - 320 ? -280 : 20;
      x.set(e.clientX + offsetX);
      y.set(e.clientY - 90);
    };
    const anchor = anchorRef.current ?? window;
    anchor.addEventListener('pointermove', onMove as EventListener, { passive: true });
    return () => anchor.removeEventListener('pointermove', onMove as EventListener);
  }, [anchorRef, x, y]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] hidden md:block">
      <AnimatePresence>
        {active && (
          <motion.div
            key={active.tokenId}
            initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ x: sx, y: sy }}
            className="absolute left-0 top-0 w-64 overflow-hidden rounded-xl border border-yellow-400/30 bg-black/85 shadow-[0_20px_60px_-10px_rgba(250,204,21,0.45)] backdrop-blur-xl"
          >
            <div
              className="relative h-28 flex items-center justify-center overflow-hidden"
              style={{ background: active.color ?? 'linear-gradient(135deg,#facc15,#a855f7)' }}
            >
              <Trophy className="h-10 w-10 text-black/40" />
              <div className="absolute bottom-2 left-3 rounded bg-black/55 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">
                #{active.rank}
              </div>
              {active.reward && (
                <div className="absolute bottom-2 right-3 rounded bg-black/55 px-2 py-0.5 text-[11px] font-bold text-yellow-300 backdrop-blur">
                  {active.reward}
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="truncate text-sm font-bold text-white">{active.title}</div>
              <div className="mt-0.5 flex items-center justify-between text-[11px] text-gray-300">
                <span className="truncate">{active.creator}</span>
                <span className="ml-2 shrink-0 font-mono text-yellow-300">{active.votes.toLocaleString()} votes</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function useHoverRevealTarget<T extends HoverEntry>() {
  const [active, setActive] = useState<T | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  return { active, setActive, anchorRef };
}
