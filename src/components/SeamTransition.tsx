'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Seam Transitions lite: gold/purple melt wipe on route change.
 * Same palette as MeltDivider + HollowStage. Reduced-motion safe.
 */
export function SeamTransition() {
  const pathname = usePathname();
  const first = useRef(true);
  const [seam, setSeam] = useState(false);
  const prev = useRef(pathname);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      prev.current = pathname;
      return;
    }
    if (prev.current === pathname) return;
    prev.current = pathname;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setSeam(true);
    const t = setTimeout(() => setSeam(false), 520);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80]">
      <AnimatePresence>
        {seam && (
          <motion.div
            key={pathname}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.26, ease: [0.65, 0, 0.35, 1] }}
            style={{ transformOrigin: 'top' }}
            className="absolute inset-0 overflow-hidden bg-gradient-to-b from-yellow-400/25 via-purple-600/20 to-transparent backdrop-blur-[1px]"
          >
            <svg className="absolute bottom-0 h-10 w-full" viewBox="0 0 1200 40" preserveAspectRatio="none">
              <path
                d="M0,24 C120,40 240,8 360,20 C480,32 600,12 720,22 C840,32 960,10 1080,20 C1140,25 1170,22 1200,20 L1200,40 L0,40 Z"
                fill="rgba(250,204,21,0.35)"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
