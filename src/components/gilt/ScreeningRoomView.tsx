'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Archive, Clapperboard, ExternalLink, ListVideo, Sparkles, Trophy, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { GiltPlayer } from '@/components/gilt/GiltPlayer';
import { ScreeningRoomArchive } from '@/components/gilt/ScreeningRoomArchive';
import { TapeoutBadge } from '@/components/gilt/TapeoutBadge';
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
 *
 * Modes (same room, different screens):
 *  - premiere (default): single feature + up-next rail
 *  - ?view=marathon: auto-advances through every minted moment on `ended`
 *  - ?view=archive: channel grid of all moments grouped by day, with the
 *    TapeOut silicon verdict and Flow provenance on every card
 */
export function ScreeningRoomView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const premiereId = searchParams.get('premiere');
  const view = searchParams.get('view');
  const isMarathon = view === 'marathon';
  const isArchive = view === 'archive';

  const [marathonIdx, setMarathonIdx] = useState(0);

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

  const featured = isMarathon
    ? minted.length > 0
      ? minted[marathonIdx % minted.length]
      : null
    : (minted.find((m) => String(m.flow_nft_id) === premiereId) ?? minted[0] ?? null);
  const upNext = isMarathon
    ? minted.filter((m) => m !== featured)
    : minted.filter((m) => m !== featured).slice(0, 6);

  const select = (flowNftId: string | number | null) => {
    router.replace(
      flowNftId ? `/screening-room?premiere=${flowNftId}` : '/screening-room',
      { scroll: false }
    );
  };

  const jumpToMarathon = (index: number) => setMarathonIdx(index);
  const handleEnded = () => {
    if (isMarathon && minted.length > 1) {
      setMarathonIdx((i) => (i + 1) % minted.length);
    }
  };

  const modeTabs = (
    <nav aria-label="Screening Room views" className="mb-4 flex gap-1.5">
      {(
        [
          { key: 'premiere', label: 'Premiere', href: '/screening-room', icon: Clapperboard },
          { key: 'marathon', label: 'Marathon', href: '/screening-room?view=marathon', icon: ListVideo },
          { key: 'archive', label: 'Archive', href: '/screening-room?view=archive', icon: Archive },
        ] as const
      ).map(({ key, label, href, icon: Icon }) => {
        const active =
          key === 'archive' ? isArchive : key === 'marathon' ? isMarathon : !isMarathon && !isArchive;
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
              active
                ? 'border-[#facc15]/50 bg-[#facc15]/15 text-[#facc15]'
                : 'border-white/10 bg-white/[0.03] text-[#f5f0e6]/60 hover:border-white/25 hover:text-[#f5f0e6]'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  if (isArchive) {
    return (
      <div className="w-full max-w-5xl">
        {modeTabs}
        <ScreeningRoomArchive moments={moments} />
        <LoopClosure />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      {modeTabs}

      {/* Marquee — real moment data over the Gilt frame */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#facc15]">
            <Clapperboard className="h-3.5 w-3.5" />
            {isMarathon
              ? `Marathon — ${Math.min(marathonIdx, Math.max(minted.length - 1, 0)) + 1} of ${minted.length}`
              : featured
                ? 'Now premiering'
                : 'Feature presentation'}
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
                <TapeoutBadge tapeout={featured.tapeout} />
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
        onEnded={isMarathon && minted.length > 1 ? handleEnded : undefined}
        autoPlay={isMarathon && minted.length > 1}
      />

      {/* Up-next rail — the content pipeline, visible */}
      {minted.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#f5f0e6]/50">
            {isMarathon ? 'Marathon playlist — click to jump' : 'Up next — premiered from the leaderboard'}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(isMarathon ? minted : [featured, ...upNext].filter(Boolean)).map((m) => {
              const active = m === featured;
              const marathonPos = isMarathon
                ? minted.findIndex((x) => x === m)
                : -1;
              return (
                <button
                  key={m!.id}
                  type="button"
                  onClick={() =>
                    isMarathon ? jumpToMarathon(marathonPos) : select(active ? null : m!.flow_nft_id)
                  }
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
                    {isMarathon && marathonPos >= 0 ? ` · #${marathonPos + 1}` : ''}
                    {active ? ' · Now showing' : ''}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <LoopClosure />
    </div>
  );
}

function LoopClosure() {
  return (
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
  );
}
