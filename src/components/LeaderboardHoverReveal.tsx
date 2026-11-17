'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useVelocity } from 'framer-motion';
import { Trophy } from 'lucide-react';

export interface HoverEntry {
  tokenId: number;
  title: string;
  creator: string;
  votes: number;
  rank: number;
  reward?: string;
  color?: string;
  mediaUrl?: string | null;
}

const CARD_W = 264;
const CARD_H = 200;
const MARGIN = 16;

/**
 * Codrops InlineHoverReveals floating preview.
 * Chases the pointer with springs, leans with horizontal velocity, and
 * flips to the opposite side near viewport edges (clamped like upstream's
 * spotFor). Fixed layer above content; pointer-events none.
 */
export function LeaderboardHoverReveal({
  active,
  anchorRef,
}: {
  active: HoverEntry | null;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 320, damping: 26, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 320, damping: 26, mass: 0.5 });

  // Lean: rotation tracks pointer speed, like upstream's quickTo rotation
  const vx = useVelocity(sx);
  const smoothVx = useSpring(vx, { stiffness: 60, damping: 20 });
  const rotate = useTransform(smoothVx, [-1200, 1200], [-14, 14]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      // Flip to the other side near edges, clamped inside the viewport
      const flipX = e.clientX + MARGIN + CARD_W > window.innerWidth - MARGIN;
      const px = flipX ? e.clientX - CARD_W - MARGIN : e.clientX + MARGIN + 8;
      const py = Math.min(
        Math.max(e.clientY - CARD_H / 2, MARGIN),
        window.innerHeight - CARD_H - MARGIN
      );
      x.set(px);
      y.set(py);
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
            initial={{ opacity: 0, scale: 0.85, clipPath: 'inset(0 100% 0 0)' }}
            animate={{ opacity: 1, scale: 1, clipPath: 'inset(0 0% 0 0)' }}
            exit={{ opacity: 0, scale: 0.9, clipPath: 'inset(0 0 0 100%)' }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            style={{ x: sx, y: sy, rotate }}
            className="absolute left-0 top-0 w-[264px] overflow-hidden rounded-xl border border-yellow-400/30 bg-black/85 shadow-[0_20px_60px_-10px_rgba(250,204,21,0.45)] backdrop-blur-xl will-change-transform"
          >
            <div
              className="relative h-28 flex items-center justify-center overflow-hidden"
              style={{ background: active.color ?? 'linear-gradient(135deg,#facc15,#a855f7)' }}
            >
              {active.mediaUrl ? (
                <video
                  src={active.mediaUrl}
                  muted
                  loop
                  playsInline
                  autoPlay
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <Trophy className="h-10 w-10 text-black/40" />
              )}
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
