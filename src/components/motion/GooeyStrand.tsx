'use client';

import { useEffect, useRef } from 'react';

/**
 * GooeyStickyMenu homage (cheap version): a goo-filtered strip that sits at
 * the bottom edge of a sticky header. Scroll velocity pulls a droplet down —
 * the blob stretches, necks, and springs back when scrolling stops.
 * Pure SVG + rAF lerp; reduced-motion and touch safe.
 */
export function GooeyStrand({ id = 'gooey-strand' }: { id?: string }) {
  const dropRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let velocity = 0;
    let stretch = 0;
    let lastY = window.scrollY;
    let raf = 0;
    let idle = 0;

    const onScroll = () => {
      const y = window.scrollY;
      velocity = y - lastY;
      lastY = y;
      idle = 0;
    };

    const loop = () => {
      idle += 1;
      // Spring: stretch tracks recent scroll speed, eases back to 0
      const target = Math.min(Math.abs(velocity) * 1.6, 90);
      stretch += (target - stretch) * (idle < 4 ? 0.35 : 0.12);
      velocity *= 0.7;
      if (dropRef.current) {
        const d = Math.max(stretch, 0.001);
        dropRef.current.setAttribute('cy', String(8 + d));
        // neck: droplet narrows as it stretches away
        dropRef.current.setAttribute('r', String(Math.max(14 - d * 0.12, 7)));
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -bottom-[104px] hidden h-28 w-full md:block"
      viewBox="0 0 100 120"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id={id}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -12"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        {/* header-edge bar the strand hangs from */}
        <rect x="0" y="0" width="100" height="14" fill="rgba(250,204,21,0.18)" />
        {/* the stretching droplet */}
        <circle ref={dropRef} cx="50" cy="8" r="14" fill="rgba(250,204,21,0.18)" />
      </g>
    </svg>
  );
}
