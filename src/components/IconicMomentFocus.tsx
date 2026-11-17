'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Download, ExternalLink, Link2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CrossVMPromotion } from '@/types/crossvm';
import { GoldCausticOverlay } from '@/components/ui/GoldCausticOverlay';

/**
 * FLIP-lite detail: filmstrip thumb (layoutId reel-*) morphs into this sheet.
 * Same gold spring used by MagneticButton / KineticHero.
 */
export function IconicMomentFocus({
  moment,
  onClose,
}: {
  moment: CrossVMPromotion | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!moment) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moment, onClose]);

  const [shareState, setShareState] = useState<'idle' | 'done'>('idle');

  const exportShareCard = async () => {
    if (!moment) return;
    const W = 540;
    const H = 960;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#1a1503');
    bg.addColorStop(0.45, '#3b2f6b');
    bg.addColorStop(1, '#0b1e3a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(250,204,21,0.9)';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText(`DAY ${moment.day}  ·  RANK #${moment.rank}`, 36, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 54px system-ui, sans-serif';
    const words = moment.title.split(' ');
    let line = '';
    let y = 160;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > W - 72 && line) {
        ctx.fillText(line, 36, y);
        line = w;
        y += 64;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, 36, y);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '500 24px system-ui, sans-serif';
    ctx.fillText(moment.flow_nft_id != null ? `Flow NFT #${moment.flow_nft_id}` : 'Iconic Moment', 36, y + 70);
    ctx.fillText(`X Layer #${moment.xlayer_token_id}`, 36, y + 104);
    ctx.fillStyle = '#facc15';
    ctx.font = '700 26px system-ui, sans-serif';
    ctx.fillText('Made with MagicLens', 36, H - 60);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `magiclens-day${moment.day}-rank${moment.rank}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setShareState('done');
    window.setTimeout(() => setShareState('idle'), 2500);
  };

  return (
    <AnimatePresence>
      {moment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            layoutId={`reel-${moment.id}`}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-yellow-400/30 bg-neutral-950 shadow-[0_30px_80px_-20px_rgba(250,204,21,0.5)]"
          >
            {moment.rank === 1 && <GoldCausticOverlay />}
            <div className="relative bg-gradient-to-br from-yellow-400/30 via-purple-500/20 to-sky-500/20 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                Day {moment.day} · Rank #{moment.rank}
              </div>
              <div className="mt-1 text-2xl font-black text-white">{moment.title}</div>
              <button
                onClick={onClose}
                aria-label="Close detail"
                className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Flow NFT</span>
                <span className="font-mono font-bold text-purple-300">
                  {moment.flow_nft_id != null ? `#${moment.flow_nft_id}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">X Layer token</span>
                <span className="font-mono text-gray-200">#{moment.xlayer_token_id}</span>
              </div>
              {moment.flow_tx_hash && (
                <a
                  href={`https://testnet.flowscan.io/transaction/${moment.flow_tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-yellow-400 py-2.5 font-semibold text-black hover:bg-yellow-500"
                >
                  View on FlowScan <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={exportShareCard}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-yellow-400/30 bg-yellow-400/10 py-2 text-xs font-semibold text-yellow-300 hover:bg-yellow-400/20"
                >
                  <Download className="h-3.5 w-3.5" />
                  {shareState === 'done' ? 'Saved 9:16 ✓' : 'Export 9:16 card'}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Rank #${moment.rank} Iconic Moment: ${moment.title} — made with MagicLens`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-lg bg-white/10 py-2 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    Post to X
                  </a>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                        const { toast } = await import('sonner');
                        toast.success('Link copied — challenge a friend to beat this');
                      } catch {}
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg bg-white/10 py-2 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    <Link2 className="h-3.5 w-3.5" /> Copy
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
