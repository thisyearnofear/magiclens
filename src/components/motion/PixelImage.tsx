'use client';

import { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

const PX_FACTORS = [100, 9, 4, 2, 1]; // coarse → sharp (upstream: [1,2,4,9,100] reversed)

/**
 * Codrops ImagePixelLoading-inspired: image resolves from big pixels to
 * sharp as it enters the viewport. Downscale→upscale on one canvas with
 * imageSmoothing off; longer dwell on the blockiest frame, then fast steps.
 */
export function PixelImage({
  src,
  alt = '',
  className,
  aspectClass = 'aspect-video',
}: {
  src: string;
  alt?: string;
  className?: string;
  aspectClass?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true, margin: '0px 0px -5% 0px' });
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // No crossOrigin: an untainted read-back isn't needed — drawImage paints
    // fine even when the canvas is tainted, so non-CORS previews still work.
    const img = new Image();
    img.src = src;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    img.onload = () => {
      const draw = (factor: number) => {
        const w = canvas.width;
        const h = canvas.height;
        // cover-crop math like background-size: cover
        const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        const size = factor * 0.01;

        ctx.imageSmoothingEnabled = factor === 1;
        ctx.clearRect(0, 0, w, h);
        // draw tiny into a corner buffer then blow up
        const tw = Math.max(1, Math.floor(dw * size));
        const th = Math.max(1, Math.floor(dh * size));
        const off = document.createElement('canvas');
        off.width = tw;
        off.height = th;
        off.getContext('2d')!.drawImage(img, 0, 0, tw, th);
        ctx.drawImage(off, 0, 0, tw, th, dx, dy, dw, dh);
      };

      if (reduced) {
        draw(1);
        return;
      }

      let i = 0;
      const step = () => {
        draw(PX_FACTORS[i]);
        i += 1;
        if (i < PX_FACTORS.length) {
          // long dwell on the blockiest frame, then rapid sharpening
          setTimeout(step, i === 1 ? 320 : 90);
        }
      };
      step();
    };
    // If the image fails, leave the alt text fallback visible
    img.onerror = () => {};
  }, [inView, src]);

  return (
    <div ref={wrapRef} className={cn('relative overflow-hidden', aspectClass, className)}>
      <canvas ref={canvasRef} width={320} height={180} className="h-full w-full object-cover" aria-label={alt} role="img" />
      {/* accessibility fallback while canvas is empty */}
      <span className="sr-only">{alt}</span>
    </div>
  );
}
