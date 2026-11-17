'use client';

/** Codrops melt / goo transition divider — pure SVG, animated with CSS. */
export function MeltDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none relative h-10 overflow-hidden ${flip ? 'rotate-180' : ''}`}>
      <svg
        className="melt-drift absolute inset-0 h-full w-[200%]"
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
      >
        <path
          d="M0,24 C120,40 240,8 360,20 C480,32 600,12 720,22 C840,32 960,10 1080,20 C1140,25 1170,22 1200,20 L1200,40 L0,40 Z"
          fill="rgba(250,204,21,0.10)"
        />
        <path
          d="M0,28 C140,38 260,16 380,26 C500,36 620,18 740,27 C860,36 980,18 1100,26 L1200,24 L1200,40 L0,40 Z"
          fill="rgba(168,85,247,0.12)"
        />
      </svg>
    </div>
  );
}
