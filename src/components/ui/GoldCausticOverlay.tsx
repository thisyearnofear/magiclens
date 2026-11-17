'use client';

/**
 * Codrops Caustic-inspired liquid-gold shimmer for rank-1 cards.
 * SVG turbulence displacement (no WebGL) + animated highlight sweep.
 * Respects prefers-reduced-motion via CSS.
 */
export function GoldCausticOverlay({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <svg className="absolute inset-0 h-full w-full opacity-60 mix-blend-overlay">
        <filter id="gold-caustic">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="7" result="n">
            <animate attributeName="baseFrequency" dur="9s" values="0.012 0.02;0.018 0.028;0.012 0.02" repeatCount="indefinite" />
          </feTurbulence>
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 0.75  0 0 0 0 0.25  0 0 0 0.55 0" />
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
        <rect width="100%" height="100%" filter="url(#gold-caustic)" />
      </svg>
      <div className="caustic-sweep absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/25 to-transparent" />
    </div>
  );
}
