'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * CinemaSeatPreview homage (2D version): pick a seat in the house and the
 * "camera" leans toward it — the stage scales/shifts toward that seat's side
 * and projector light spills across the room.
 */
const ROWS = [
  { id: 'A', seats: 8, r: 1 },
  { id: 'B', seats: 10, r: 2 },
  { id: 'C', seats: 8, r: 3 },
];

export interface SeatSelection {
  row: string;
  seat: number;
  /** -1 (house left) … 1 (house right), used to shift the stage */
  pan: number;
  /** 0 (front) … 1 (back), used for scale */
  depth: number;
}

export function SeatMap({
  taken = 0.35,
  onSelect,
  selected,
}: {
  taken?: number;
  onSelect: (seat: SeatSelection | null) => void;
  selected: SeatSelection | null;
}) {
  // deterministic "taken" pattern so it doesn't reshuffle per render
  const isTaken = (row: string, seat: number) =>
    ((row.charCodeAt(0) * 31 + seat * 17) % 100) / 100 < taken;

  const toggle = (row: string, seat: number, index: number, total: number, rowDepth: number) => {
    if (isTaken(row, seat)) return;
    const pan = total > 1 ? (index / (total - 1)) * 2 - 1 : 0;
    const sel: SeatSelection = { row, seat: seat + 1, pan, depth: rowDepth };
    onSelect(selected?.row === sel.row && selected?.seat === sel.seat ? null : sel);
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#f5f0e6]/50">
          Pick your seat
        </p>
        {selected && (
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#facc15]">
            Row {selected.row} · Seat {selected.seat}
          </p>
        )}
      </div>

      {/* screen glow line */}
      <div className="mx-auto mb-4 h-1 w-3/4 rounded-full bg-gradient-to-r from-transparent via-[#facc15]/50 to-transparent blur-[1px]" />

      <div className="space-y-2">
        {ROWS.map((row, ri) => (
          <div key={row.id} className="flex items-center justify-center gap-1.5">
            <span className="w-4 font-mono text-[9px] text-[#f5f0e6]/40">{row.id}</span>
            {Array.from({ length: row.seats }).map((_, i) => {
              const occupied = isTaken(row.id, i);
              const isSelected = selected?.row === row.id && selected?.seat === i + 1;
              return (
                <motion.button
                  key={i}
                  type="button"
                  disabled={occupied}
                  onClick={() => toggle(row.id, i, i, row.seats, ri / (ROWS.length - 1))}
                  whileHover={occupied ? undefined : { scale: 1.15 }}
                  whileTap={occupied ? undefined : { scale: 0.9 }}
                  aria-label={occupied ? `Seat ${row.id}${i + 1} taken` : `Seat ${row.id}${i + 1}`}
                  aria-pressed={isSelected}
                  className={cn(
                    'h-5 w-6 rounded-t-md border transition-colors sm:h-6 sm:w-7',
                    occupied
                      ? 'cursor-not-allowed border-white/5 bg-white/[0.03]'
                      : isSelected
                        ? 'border-[#facc15] bg-[#facc15] shadow-[0_0_14px_rgba(250,204,21,0.6)]'
                        : 'border-white/20 bg-white/10 hover:border-[#facc15]/60 hover:bg-[#facc15]/20'
                  )}
                />
              );
            })}
            <span className="w-4" />
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[10px] text-[#f5f0e6]/40">
        House lights dim and the view shifts to your seat.
      </p>
    </div>
  );
}

/**
 * Wraps the video stage; leans it toward the chosen seat with a
 * radial projector-light spill behind it.
 */
export function SeatedStage({
  selection,
  children,
}: {
  selection: SeatSelection | null;
  children: React.ReactNode;
}) {
  const panX = selection ? selection.pan * -24 : 0;
  const scale = selection ? 1.03 + selection.depth * 0.04 : 1;
  const tilt = selection ? selection.pan * 1.6 : 0;

  return (
    <div className="relative">
      {/* projector light spill */}
      <AnimatePresence>
        {selection && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute -inset-10 -z-10"
            style={{
              background: `radial-gradient(60% 60% at ${50 - selection.pan * 30}% 40%, rgba(250,204,21,0.16), rgba(168,85,247,0.08) 55%, transparent 75%)`,
            }}
          />
        )}
      </AnimatePresence>
      <motion.div
        animate={{ x: panX, scale, rotateY: tilt }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        style={{ transformPerspective: 1000 }}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}
