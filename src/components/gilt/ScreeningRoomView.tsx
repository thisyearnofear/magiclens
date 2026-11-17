'use client';

import { useQuery } from '@tanstack/react-query';
import { Clapperboard, ExternalLink, Sparkles, Trophy, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { GiltPlayer } from '@/components/gilt/GiltPlayer';
import { Badge } from '@/components/ui/badge';
import { getIconicMoments } from '@/lib/crossvm-client';
import { cn } from '@/lib/utils';

/**
 * The Screening Room as distribution endpoint: every Flow Iconic Moment gets a
 * cinematic premiere here. `?premiere=<flow_nft_id>` deep-links a moment (used
 * by the gallery's Premiere buttons); otherwise the latest minted moment
 * headlines. The house reel plays on the Gilt skin while the marquee, receipt
 * links and up-next rail are all real app data — that's the story for the
 * Skins Challenge judges: a skin with a built-in audience and a content
 * pipeline, not a standalone demo.
 */
export function ScreeningRoomView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const premiereId = searchParams.get('premiere');

  const momentsQuery = useQuery({
    queryKey: ['iconic-moments', 'all'],
    queryFn: () => getIconicMoments(),
    staleTime: 15_000,
    retry: 1,
  });
  const moments = momentsQuery.data ?? [];
  // Only minted moments with a real clip can premiere — anything else would
  // headline a title while the house reel plays underneath.
  const minted = moments.filter((m) => m.status === 'minted' && m.media_url);

  const featured =
    minted.find((m) => String(m.flow_nft_id) === premiereId) ?? minted[0] ?? null;
  const upNext = minted.filter((m) => m !== featured).slice(0, 6);

  const select = (flowNftId: string | number | null) => {
    router.replace(
      flowNftId ? `/screening-room?premiere=${flowNftId}` : '/screening-room',
      { scroll: false }
    );
  };

  return (
    <div className="w-full max-w-5xl">
      {/* Marquee — real moment data over the Gilt frame */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#facc15]">
            <Clapperboard className="h-3.5 w-3.5" />
            {featured ? "Now premiering" : 'Feature presentation'}
          </p>
          <h2 className="mt-1 truncate text-xl font-black text-[#f5f0e6] sm:text-2xl">
            {featured
              ? featured.title
              : 'MagicLens Sizzle Reel'}
          </h2>
          {featured && (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#f5f0e6]/60">
              <span className="inline-flex items-center gap-1">
                <Trophy className="h-3 w-3 text-[#facc15]" />
                Day {featured.day} · Rank #{featured.rank}
              </span>
              {featured.flow_nft_id != null && (
                <a
                  href={`https://testnet.flowscan.io/token/${featured.flow_nft_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-purple-300 hover:text-purple-200"
                >
                  Flow NFT #{featured.flow_nft_id}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {featured.tapeout?.verified && (
                <a
                  href={`https://www.oklink.com/xlayer/address/${featured.tapeout.processor}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-amber-300/90 hover:text-amber-200"
                  title={`ICONIC-GATE circuit #${featured.tapeout.circuit_id} — ${featured.tapeout.promote ? 'promote ✓' : 'promote ✗'}, score ${featured.tapeout.score}/15`}
                >
                  <Badge variant="outline" className="border-amber-400/40 text-amber-300 px-1 py-0 text-[9px]">
                    Si
                  </Badge>
                  {featured.tapeout.promote ? 'Cleared' : 'Audited'} by TapeOut #{featured.tapeout.circuit_id} · {featured.tapeout.score}/15
                </a>
              )}
            </p>
          )}
        </div>
        <Link
          href="/iconic-moments"
          className="shrink-0 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f5f0e6]/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          All Iconic Moments
        </Link>
      </div>

      <GiltPlayer
        src={featured?.media_url || undefined}
        featureKey={featured?.media_url || featured?.flow_nft_id || 'house-reel'}
      />

      {/* Up-next rail — the content pipeline, visible */}
      {minted.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#f5f0e6]/50">
            Up next — premiered from the leaderboard
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[featured, ...upNext].filter(Boolean).map((m) => {
              const active = m === featured;
              return (
                <button
                  key={m!.id}
                  type="button"
                  onClick={() => select(active ? null : m!.flow_nft_id)}
                  className={cn(
                    'rounded-md border p-3 text-left transition-colors',
                    active
                      ? 'border-[#facc15]/50 bg-[#facc15]/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                  )}
                >
                  <p className="truncate text-sm font-semibold text-[#f5f0e6]">{m!.title}</p>
                  <p className="mt-0.5 text-[11px] text-[#f5f0e6]/50">
                    Day {m!.day} · Rank #{m!.rank}
                    {active ? ' · Now showing' : ''}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Loop closure — watchers become creators */}
      <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-[#facc15]/20 bg-[#facc15]/5 p-5 text-center">
        <p className="flex items-center gap-1.5 text-sm text-[#f5f0e6]/80">
          <Sparkles className="h-4 w-4 text-[#facc15]" />
          Every premiere started as a free guest remix.
        </p>
        <Link
          href="/remix"
          className="inline-flex items-center gap-1.5 rounded-md bg-[#facc15] px-4 py-2 text-sm font-bold text-black hover:bg-[#fde047] transition-colors"
        >
          <Wand2 className="h-4 w-4" />
          Start Creating — No Wallet Needed
        </Link>
      </div>
    </div>
  );
}
