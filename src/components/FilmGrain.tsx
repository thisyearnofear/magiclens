'use client';

/**
 * Moss / tangle-inspired film grain — global cohesion layer.
 * SVG noise at 5% opacity, sits above backdrops, below content glow.
 */
export function FilmGrain() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] opacity-[0.05] mix-blend-overlay">
      <svg className="h-full w-full">
        <filter id="magiclens-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#magiclens-grain)" />
      </svg>
    </div>
  );
}
