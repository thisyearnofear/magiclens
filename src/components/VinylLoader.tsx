'use client';

import { cn } from '@/lib/utils';

/**
 * Codrops vinyl-inspired loader: spinning record for mint / promote pending states.
 * CSS only, reduced-motion safe.
 */
export function VinylLoader({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
      className={cn('vinyl-spin relative shrink-0 rounded-full', className)}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neutral-800 to-black border border-white/15" />
      <div className="absolute inset-[18%] rounded-full border border-white/10" />
      <div className="absolute inset-[32%] rounded-full border border-white/10" />
      <div className="absolute inset-[42%] rounded-full bg-yellow-400 flex items-center justify-center">
        <div className="h-1.5 w-1.5 rounded-full bg-black" />
      </div>
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
    </div>
  );
}
