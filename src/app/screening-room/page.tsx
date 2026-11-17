import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ScreeningRoomView } from '@/components/gilt/ScreeningRoomView';

import './screening-room.css';

export const metadata: Metadata = {
  title: 'The Screening Room — MagicLens',
  description:
    'Gilt, a cinematic Video.js v10 skin: projector grain, film-gate frame ticks, a vinyl buffering indicator, and a sprocket-toothed timeline. Every Flow Iconic Moment premieres here.',
};

export default function ScreeningRoomPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-[#0a0906] px-4 py-10 text-[#f5f0e6] sm:px-8">
      {/* Compiled Gilt skin stylesheet (Tailwind 4 output; served statically).
          `precedence` hoists it to <head> (React 19) instead of flashing in body. */}
      <link rel="stylesheet" precedence="high" href="/gilt-skin.css" />
      <header className="mb-8 w-full max-w-5xl text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#facc15]">
          MagicLens Presents
        </p>
        <h1 className="text-3xl font-black uppercase tracking-[0.18em] sm:text-4xl">
          The Screening Room
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[#f5f0e6]/60">
          Gilt — a cinematic Video.js v10 skin. Projector grain, film-gate frame ticks, a
          vinyl record while buffering, and a sprocket-toothed timeline. Every Flow
          Iconic Moment premieres here, straight from the leaderboard. Built for the
          Video.js Skins Design Challenge.
        </p>
      </header>

      <Suspense>
        <ScreeningRoomView />
      </Suspense>

      <footer className="mt-8 w-full max-w-5xl text-center text-xs text-[#f5f0e6]/40">
        Video hosted on Mux · Skin built with Video.js v10 · Apache-2.0
      </footer>
    </main>
  );
}
