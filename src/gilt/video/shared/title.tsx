/** @jsxImportSource react */

import { Title as TitlePrimitive } from '@videojs/react';

import { cn } from '@/gilt/lib/resolve-class-name';

export function Title() {
  return (
    <TitlePrimitive
      className={cn(
        'gilt-title pointer-events-none media-max-3xs:hidden min-w-0 px-2 py-1 flex-1 truncate text-[calc(var(--media-spacing)*3.5)] font-black uppercase tracking-[0.18em]',
        'before:mr-2 before:inline-block before:h-[0.85em] before:w-[3px] before:bg-media-accent before:align-[-0.05em] before:content-[""]',
        'not-data-visible:opacity-0'
      )}
    />
  );
}
