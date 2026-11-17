'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Match the gallery's responsive breakpoints: 1 / 2 / 3 / 4 columns. */
function useColumnCount() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const queries: Array<[string, number]> = [
      ['(min-width: 1280px)', 4],
      ['(min-width: 1024px)', 3],
      ['(min-width: 640px)', 2],
    ];
    const mqs = queries.map(([q]) => window.matchMedia(q));
    const update = () => {
      const hit = mqs.findIndex((mq) => mq.matches);
      setCount(hit === -1 ? 1 : queries[hit][1]);
    };
    update();
    mqs.forEach((mq) => mq.addEventListener('change', update));
    return () => mqs.forEach((mq) => mq.removeEventListener('change', update));
  }, []);
  return count;
}

function ElasticColumn({
  children,
  speed,
  stiffness,
}: {
  children: React.ReactNode;
  speed: number;
  stiffness: number;
}) {
  const { scrollY } = useScroll();
  // Parallax drift + damped spring = columns travel at different speeds
  // and wobble when scrolling stops (the "elastic" feel).
  const target = useTransform(scrollY, (v) => -v * speed);
  const y = useSpring(target, { stiffness, damping: 26, mass: 0.8 });
  return (
    <motion.div style={{ y }} className="flex-1 space-y-4 will-change-transform">
      {children}
    </motion.div>
  );
}

/**
 * Codrops ElasticGridScroll-inspired: gallery columns drift at different
 * scroll velocities with damped springs — soft elastic feel.
 * Falls back to a plain grid under reduced motion.
 */
export function ElasticColumns<T>({
  items,
  renderItem,
  className,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}) {
  const columns = useColumnCount();
  const reduced = useReducedMotion();

  // Outer columns drift more; center lags least (upstream: baseLag + distance*lagScale)
  const columnParams = useMemo(() => {
    const mid = (columns - 1) / 2;
    return Array.from({ length: columns }, (_, i) => ({
      speed: 0.02 + Math.abs(i - mid) * 0.035,
      stiffness: 140 - Math.abs(i - mid) * 25,
    }));
  }, [columns]);

  const grouped = useMemo(() => {
    const cols: T[][] = Array.from({ length: columns }, () => []);
    items.forEach((item, i) => cols[i % columns].push(item));
    return cols;
  }, [items, columns]);

  if (reduced || columns === 1) {
    return (
      <div className={cn('grid grid-cols-1 gap-4', className)}>
        {items.map(renderItem)}
      </div>
    );
  }

  return (
    <div className={cn('flex gap-4', className)}>
      {grouped.map((col, i) => (
        <ElasticColumn key={i} speed={columnParams[i].speed} stiffness={columnParams[i].stiffness}>
          {col.map((item, j) => renderItem(item, i + j * columns))}
        </ElasticColumn>
      ))}
    </div>
  );
}
