'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { CrossVMPromotion } from '@/types/crossvm';
import { GoldCausticOverlay } from '@/components/ui/GoldCausticOverlay';
import { IconicMomentFocus } from '@/components/IconicMomentFocus';

/**
 * Codrops horizontal filmstrip: draggable / scroll-snap reel of Iconic Moments.
 * Cohesive: same card language as MomentCard, gold caustic on rank-1, reduced-motion safe.
 */
export function IconicFilmstrip({ moments }: { moments: CrossVMPromotion[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [focused, setFocused] = useState<CrossVMPromotion | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [moments.length]);

  // Click-drag to scroll (desktop)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    let down = false;
    let startX = 0;
    let startLeft = 0;
    const onDown = (e: PointerEvent) => {
      down = true;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      el.scrollLeft = startLeft - (e.clientX - startX);
    };
    const onUp = () => {
      down = false;
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  if (moments.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-yellow-300">
          Iconic reel — drag / scroll
        </div>
        <div className="text-[11px] text-gray-400 font-mono">{moments.length} moments</div>
      </div>
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto px-4 py-3 snap-x snap-mandatory cursor-grab active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {moments.map((m) => (
          <motion.button
            key={m.id}
            type="button"
            layoutId={`reel-${m.id}`}
            onClick={() => setFocused(m)}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="relative h-24 w-44 shrink-0 snap-start overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-yellow-400/25 via-purple-500/20 to-sky-500/20 text-left"
          >
            {m.rank === 1 && <GoldCausticOverlay />}
            <div className="absolute inset-0 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white/40" />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <div className="truncate text-[11px] font-bold text-white">{m.title}</div>
              <div className="text-[10px] text-yellow-300 font-mono">
                #{m.rank} · Day {m.day}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
      <div className="px-4 pb-3">
        <div className="h-0.5 overflow-hidden rounded bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-purple-400 transition-[width]"
            style={{ width: `${Math.max(8, progress * 100)}%` }}
          />
        </div>
      </div>
      <IconicMomentFocus moment={focused} onClose={() => setFocused(null)} />
    </div>
  );
}
