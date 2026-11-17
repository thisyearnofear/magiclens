'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface Flight {
  id: number;
  path: string;
  startX: number;
  startY: number;
  label?: string;
}

/**
 * GridFlowEffect/MotionPath homage: after a mint, the remix "chip" flies
 * along an SVG curve into the leaderboard dock — "entering the battle"
 * made literal. Uses CSS offset-path so the curve is exact.
 */
export function useFlightToLeaderboard() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const counter = useRef(0);

  const launch = (fromRect: { x: number; y: number }, label?: string) => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Target: the bottom-tab "Compete" slot on mobile, else top-right (headers)
    const target = document.querySelector<HTMLElement>('[data-flight-target="leaderboard"]');
    const end = target
      ? { x: target.getBoundingClientRect().left + 20, y: target.getBoundingClientRect().top }
      : { x: window.innerWidth - 60, y: 70 };

    if (reduced) return; // user just navigates normally

    const cx = (fromRect.x + end.x) / 2;
    const cy = Math.min(fromRect.y, end.y) - Math.max(120, Math.abs(end.x - fromRect.x) * 0.25);
    const path = `M ${fromRect.x} ${fromRect.y} Q ${cx} ${cy} ${end.x} ${end.y}`;

    const flight: Flight = { id: counter.current++, path, startX: fromRect.x, startY: fromRect.y, label };
    setFlights((prev) => [...prev, flight]);
    window.setTimeout(() => {
      setFlights((prev) => prev.filter((f) => f.id !== flight.id));
    }, 1400);
  };

  const layer = (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[96]">
      <AnimatePresence>
        {flights.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.25 }}
            className="absolute"
            style={{ offsetPath: `path('${f.path}')` }}
          >
            <div
              className="motion-safe:animate-[flight-along_1.15s_cubic-bezier(0.4,0,0.2,1)_forwards] flex h-12 w-20 items-center justify-center gap-1 rounded-lg border border-yellow-400/50 bg-[#0d0b16] shadow-[0_10px_30px_-5px_rgba(250,204,21,0.5)]"
              style={{ offsetPath: `path('${f.path}')`, offsetDistance: '0%' }}
            >
              <Trophy className="h-4 w-4 shrink-0 text-yellow-400" />
              <span className="max-w-[44px] truncate text-[8px] font-semibold text-white">
                {f.label ?? 'remix'}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return { launch, layer };
}
