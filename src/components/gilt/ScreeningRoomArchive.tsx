'use client';

import { useMemo, useState } from 'react';
import { Archive, Clapperboard, ExternalLink, Trophy } from 'lucide-react';
import Link from 'next/link';

import { TapeoutBadge } from '@/components/gilt/TapeoutBadge';
import type { CrossVMPromotion } from '@/types/crossvm';
import { cn } from '@/lib/utils';

/**
 * Archive/channel mode for the Screening Room: every Iconic Moment grouped
 * by leaderboard day, with its TapeOut silicon verdict and Flow provenance.
 * Moments without a playable clip are listed too — the archive is the audit
 * trail, not just the marquee.
 */
export function ScreeningRoomArchive({ moments }: { moments: CrossVMPromotion[] }) {
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all');

  const days = useMemo(
    () => [...new Set(moments.map((m) => m.day))].sort((a, b) => b - a),
    [moments]
  );
  const visible = dayFilter === 'all' ? moments : moments.filter((m) => m.day === dayFilter);
  const grouped = useMemo(() => {
    const map = new Map<number, CrossVMPromotion[]>();
    for (const m of visible) {
      const list = map.get(m.day) ?? [];
      list.push(m);
      map.set(m.day, list);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [visible]);

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#facc15]">
            <Archive className="h-3.5 w-3.5" />
            Archive — every premiere on record
          </p>
          <h2 className="mt-1 text-xl font-black text-[#f5f0e6] sm:text-2xl">
            The Channel
          </h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setDayFilter('all')}
            className={cn(
              'rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors',
              dayFilter === 'all'
                ? 'border-[#facc15]/50 bg-[#facc15]/15 text-[#facc15]'
                : 'border-white/10 bg-white/[0.03] text-[#f5f0e6]/60 hover:border-white/25'
            )}
          >
            All days
          </button>
          {days.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDayFilter(d)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                dayFilter === d
                  ? 'border-[#facc15]/50 bg-[#facc15]/15 text-[#facc15]'
                  : 'border-white/10 bg-white/[0.03] text-[#f5f0e6]/60 hover:border-white/25'
              )}
            >
              Day {d}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="rounded-md border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-[#f5f0e6]/50">
          No Iconic Moments yet — the archive fills as the leaderboard crowns winners.
        </p>
      ) : (
        grouped.map(([day, items]) => (
          <section key={day} className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#f5f0e6]/50">
              <Trophy className="h-3 w-3 text-[#facc15]" />
              Day {day} — {items.length} moment{items.length === 1 ? '' : 's'}
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m) => (
                <article
                  key={m.id}
                  className="flex flex-col rounded-md border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[#f5f0e6]">
                      {m.title}
                    </p>
                    <span className="shrink-0 rounded bg-black/40 px-1.5 py-0.5 text-[11px] font-bold text-[#facc15]">
                      #{m.rank}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#f5f0e6]/50">
                    {m.status === 'minted' ? 'Minted' : m.status}
                    {m.flow_nft_id != null && ` · Flow NFT #${m.flow_nft_id}`}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                    {m.flow_nft_id != null && (
                      <a
                        href={`https://testnet.flowscan.io/token/${m.flow_nft_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-purple-300 hover:text-purple-200"
                      >
                        FlowScan <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {m.tapeout?.verified && <TapeoutBadge tapeout={m.tapeout} compact />}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {m.status === 'minted' && m.media_url ? (
                      <Link
                        href={`/screening-room?premiere=${m.flow_nft_id ?? ''}`}
                        className="flex-1 rounded bg-[#facc15]/15 py-1.5 text-center text-[11px] font-semibold text-[#facc15] hover:bg-[#facc15]/25 transition-colors"
                      >
                        <Clapperboard className="mr-1 inline h-3 w-3" />
                        Premiere
                      </Link>
                    ) : (
                      <span className="flex-1 rounded bg-white/[0.04] py-1.5 text-center text-[11px] text-[#f5f0e6]/35">
                        No clip
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
