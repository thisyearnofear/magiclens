'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrailItem {
  id: number;
  src: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  rot: number;
}

/**
 * Codrops MotionTrailAnimations-inspired: moving the pointer spawns a
 * decaying trail of images. A lagging "trailing" point chases the pointer;
 * one image spawns per `threshold` px of travel (even spacing at any speed,
 * capped per frame like upstream's maxPerFrame).
 *
 * Desktop-only, reduced-motion safe.
 */
export function MotionTrail({
  images,
  threshold = 90,
  poolSize = 10,
  className,
}: {
  images: string[];
  threshold?: number;
  poolSize?: number;
  className?: string;
}) {
  const [items, setItems] = useState<TrailItem[]>([]);
  const state = useRef({
    pointer: { x: 0, y: 0 },
    trailing: { x: 0, y: 0 },
    last: { x: 0, y: 0 },
    started: false,
    idx: 0,
    counter: 0,
  });

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (images.length === 0) return;

    const s = state.current;
    let raf = 0;

    const spawn = (x: number, y: number) => {
      const item: TrailItem = {
        id: s.counter++,
        src: images[s.idx++ % images.length],
        fromX: s.trailing.x,
        fromY: s.trailing.y,
        toX: x,
        toY: y,
        rot: (Math.random() - 0.5) * 24,
      };
      setItems((prev) => [...prev.slice(-(poolSize - 1)), item]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((p) => p.id !== item.id));
      }, 900);
    };

    const onMove = (e: PointerEvent) => {
      s.pointer = { x: e.clientX, y: e.clientY };
      if (!s.started) {
        s.started = true;
        s.trailing = { ...s.pointer };
        s.last = { ...s.pointer };
      }
    };

    const loop = () => {
      if (s.started) {
        // Frame-rate independent lag toward the pointer
        const follow = 1 - Math.pow(1 - 0.12, 1);
        s.trailing.x += (s.pointer.x - s.trailing.x) * follow;
        s.trailing.y += (s.pointer.y - s.trailing.y) * follow;

        // Walk from `last` toward the pointer in `threshold` steps
        const dx = s.pointer.x - s.last.x;
        const dy = s.pointer.y - s.last.y;
        let distance = Math.hypot(dx, dy);
        if (distance >= threshold) {
          const step = { x: (dx / distance) * threshold, y: (dy / distance) * threshold };
          for (let n = 0; distance >= threshold && n < 3; n++) {
            s.last = { x: s.last.x + step.x, y: s.last.y + step.y };
            distance -= threshold;
            spawn(s.last.x, s.last.y);
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [images, threshold, poolSize]);

  if (images.length === 0) return null;

  return (
    <div aria-hidden="true" className={`pointer-events-none fixed inset-0 z-[5] overflow-hidden ${className ?? ''}`}>
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ x: item.fromX - 64, y: item.fromY - 40, opacity: 1, scale: 1, rotate: item.rot }}
            animate={{ x: item.toX - 64, y: item.toY - 40 }}
            exit={{ opacity: 0, scale: 0.2 }}
            transition={{
              x: { duration: 0.4, ease: 'easeOut' },
              y: { duration: 0.4, ease: 'easeOut' },
              exit: { duration: 0.35, ease: 'easeIn' },
            }}
            className="absolute h-20 w-32 overflow-hidden rounded-lg border border-white/20 shadow-xl shadow-black/40"
          >
            <img src={item.src} alt="" className="h-full w-full object-cover" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
