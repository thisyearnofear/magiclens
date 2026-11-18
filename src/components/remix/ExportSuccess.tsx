'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Share2, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportSuccessProps {
  /** Blob URL of the exported remix — the panel replays the real result */
  videoUrl: string;
  extension: string;
  duration: number;
  clipTitle: string;
  watermarked: boolean;
  onDownloadAgain: () => void;
  onMint: () => void;
  onClose: () => void;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  rot: number; vr: number; size: number; color: string; shape: number;
}

const COLORS = ['#facc15', '#fde047', '#a855f7', '#38bdf8', '#22c55e', '#f472b6'];

export function ExportSuccess({
  videoUrl, extension, duration, clipTitle, watermarked,
  onDownloadAgain, onMint, onClose,
}: ExportSuccessProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // One celebratory rain of confetti on mount — self-contained, no deps.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const parts: Particle[] = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 2.2,
      vy: 1.6 + Math.random() * 2.6,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.22,
      size: 4 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.floor(Math.random() * 3),
    }));

    let raf = 0;
    let age = 0;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      age += 1;
      for (const p of parts) {
        p.vy += 0.05;
        p.x += p.vx + Math.sin(age * 0.05 + p.rot) * 0.8;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.y > canvas.height ? 0 : 0.9;
        if (p.shape === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 1) {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (age < 240 && parts.some(p => p.y < canvas.height + 20)) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const shareText = `Just remixed "${clipTitle}" with pose-aware AR on MagicLens ⚡ — remixes compete daily for Iconic Moment status.`;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <motion.div
        className="relative w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/70 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* The real exported video, looping */}
        <div className="aspect-video bg-black">
          <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Your remix is ready</h3>
              <p className="text-gray-300 text-xs mt-0.5">
                {extension.toUpperCase()} · {duration.toFixed(0)}s
                {watermarked ? ' · MagicLens mark' : ' · watermark-free'} — it&apos;s already downloading
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-lg bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-semibold px-3 py-2.5 hover:bg-sky-500/25 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" /> Post to X
            </a>
            <Button
              variant="outline"
              onClick={onDownloadAgain}
              className="h-auto py-2.5 text-xs font-semibold bg-white/5 border-white/15 text-white hover:bg-white/10"
            >
              <Download className="h-3.5 w-3.5 mr-1" /> Download again
            </Button>
          </div>

          <button
            onClick={onMint}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-yellow-400 text-black text-sm font-bold px-3 py-3 hover:bg-yellow-500 transition-colors"
          >
            Mint it — enter today&apos;s battle <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
