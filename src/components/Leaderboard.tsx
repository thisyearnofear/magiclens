import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Zap, DollarSign, Sparkles, Loader2, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { useAuthContext } from '@/auth/AuthProvider';
import { getUserRemixes } from '@/lib/remix-store';
import { useIconicMoments } from '@/hooks/useIconicMoments';
import { IconicMomentBadge } from '@/components/IconicMomentBadge';
import { MobileNav } from '@/components/MobileNav';
import { DemoBanner } from '@/components/DemoBanner';
import { toast } from 'sonner';
import { DEMO_LEADERBOARD_ENTRIES } from '@/lib/demo-data';
import type { CrossVMPromotion } from '@/types/crossvm';

const DEMO_LEADERBOARD = DEMO_LEADERBOARD_ENTRIES;

interface LeaderboardEntry {
  rank: number;
  title: string;
  creator: string;
  votes: number;
  reward: string;
  color: string;
  tokenId: number;
  txHash: string;
  isUser?: boolean;
}

export default function Leaderboard() {
  const router = useRouter();
  const { isConnected, evmAddress, isGuest } = useAuthContext();
  const { moments, promote, isPromoting, loading: momentsLoading } = useIconicMoments({ day: 1 });
  const [entries, setEntries] = useState<LeaderboardEntry[]>(DEMO_LEADERBOARD);
  const [closingDay, setClosingDay] = useState(false);
  const [cycleStatus, setCycleStatus] = useState<'open' | 'closed' | 'promoting' | 'completed' | null>(null);
  const [promoteResults, setPromoteResults] = useState<{ promoted: number; errors: string[] } | null>(null);

  const iconicByTokenId = new Map<number, CrossVMPromotion>();
  moments.forEach(m => iconicByTokenId.set(m.xlayer_token_id, m));

  useEffect(() => {
    const userRemixes = getUserRemixes();
    if (userRemixes.length === 0) return;

    const userEntries: LeaderboardEntry[] = userRemixes.map((r) => ({
      rank: 0,
      title: r.title,
      creator: r.creator,
      votes: r.votes,
      reward: '',
      color: 'text-gray-400',
      tokenId: parseInt(r.txHash.slice(-8), 16) % 10000 + 2000,
      txHash: r.txHash,
      isUser: true,
    }));

    const merged = [...DEMO_LEADERBOARD, ...userEntries]
      .sort((a, b) => b.votes - a.votes)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    setEntries(merged);
  }, []);

  // Poll for cycle status after day is closed
  useEffect(() => {
    if (cycleStatus !== 'closed' && cycleStatus !== 'promoting') return;
    const interval = setInterval(async () => {
      try {
        const { getLeaderboardDayStatus } = await import('@/lib/crossvm-client');
        const data = await getLeaderboardDayStatus(1);
        if (data.success) {
          setCycleStatus(data.day_status.status);
          if (data.day_status.status === 'completed') {
            const top3 = data.day_status.entries?.filter((e: any) => e.rank <= 3) ?? [];
            const minted = top3.filter((e: any) => e.iconic_status === 'minted').length;
            const failed = top3.filter((e: any) => e.iconic_status === 'failed').length;
            setPromoteResults({ promoted: minted, errors: failed > 0 ? [`${failed} promotions failed`] : [] });
            clearInterval(interval);
          }
        }
      } catch (e) {
        // polling error is non-critical — day may not exist yet
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [cycleStatus]);

  const handleCloseDay = async () => {
    if (isGuest) {
      toast.info('Connect a wallet to close the leaderboard');
      return;
    }
    setClosingDay(true);
    try {
      const { closeLeaderboardDay } = await import('@/lib/crossvm-client');
      const top10 = entries.slice(0, 10).map(e => ({
        rank: e.rank,
        title: e.title,
        creator: e.creator,
        votes: e.votes,
        reward: e.reward,
        xlayer_token_id: e.tokenId,
        xlayer_tx_hash: e.txHash,
        xlayer_creator_address: evmAddress || '0x0000000000000000000000000000000000000000',
      }));
      const result = await closeLeaderboardDay(1, top10);
      if (result.success) {
        setCycleStatus('closed');
        toast.success('Leaderboard closed! Auto-promote scheduled.', {
          description: 'Top-3 entries will be promoted to Flow Iconic Moments shortly.',
        });
      } else {
        toast.error(result.error || 'Failed to close day');
      }
    } catch (err) {
      toast.error('Failed to close leaderboard day');
    } finally {
      setClosingDay(false);
    }
  };

  const handlePromote = async (entry: LeaderboardEntry) => {
    if (isGuest) {
      toast.info('Connect a wallet to promote remixes');
      return;
    }
    try {
      await promote({
        xlayerTokenId: entry.tokenId,
        xlayerTxHash: entry.txHash,
        xlayerCreatorAddress: evmAddress || '0x0000000000000000000000000000000000000000',
        title: entry.title,
        day: 1,
        rank: entry.rank,
      });
      toast.success(`${entry.title} promoted to Flow Iconic Moment!`, {
        description: 'This remix has been minted as a premium Flow Cadence NFT.',
      });
    } catch (err) {
      toast.error('Promotion failed', {
        description: err instanceof Error ? err.message : 'Could not promote remix',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <DemoBanner message="Preview data — real leaderboard appears when users mint and vote." />
      <header className="border-b border-white/10 bg-black/20">
        <div className="container mx-auto px-4 py-4">
          <MobileNav title="Today's Leaderboard" icon={<Trophy className="h-8 w-8 text-yellow-400 shrink-0" />} />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Prize pool + Cross-VM banner */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-yellow-400/20 to-purple-400/20 border-yellow-400/30 md:col-span-2">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">World Cup 2026 — Day 1</h2>
                <p className="text-gray-300 text-sm mt-1">Top 10 remixes win USDT rewards. Top 3 become Flow Iconic Moments.</p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div>
                  <div className="text-2xl font-bold text-yellow-400">$100</div>
                  <div className="text-gray-400 text-xs">Prize Pool</div>
                </div>
                {cycleStatus === 'open' && (
                  <Button
                    onClick={handleCloseDay}
                    disabled={closingDay}
                    size="sm"
                    className="h-7 text-[10px] bg-yellow-400 text-black hover:bg-yellow-500 border-0 px-2"
                  >
                    {closingDay ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3 mr-1" />}
                    Close Day
                  </Button>
                )}
                {cycleStatus !== 'open' && (
                  <Button
                    onClick={() => router.push('/iconic-moments')}
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] border-blue-400/30 text-blue-300 hover:bg-blue-400/10 px-2"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    View Iconic Moments
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cross-VM info card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-400/20 h-full">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-blue-300">Cross-VM</h3>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Top 3 daily remixes are minted as premium <strong className="text-blue-300">Flow Cadence</strong> NFTs with gasless transactions.
                  </p>
                </div>
                {moments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-blue-400/10">
                    <span className="text-[11px] text-blue-400">
                      {moments.filter(m => m.status === 'minted').length} remixes promoted today
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Auto-promote status banner */}
        {(cycleStatus === 'closed' || cycleStatus === 'promoting' || cycleStatus === 'completed') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Card className={`border ${
              cycleStatus === 'completed'
                ? 'bg-green-500/10 border-green-400/30'
                : 'bg-blue-500/10 border-blue-400/30'
            }`}>
              <CardContent className="p-3 flex items-center gap-3">
                {cycleStatus === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                ) : (
                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {cycleStatus === 'closed' && 'Leaderboard closed — auto-promoting top-3 to Flow...'}
                    {cycleStatus === 'promoting' && 'Promoting top-3 entries to Flow Iconic Moments...'}
                    {cycleStatus === 'completed' && 'Day completed! Top-3 promoted to Flow Iconic Moments.'}
                  </p>
                  {promoteResults && (
                    <p className="text-xs text-green-400 mt-0.5">
                      {promoteResults.promoted} remixes promoted successfully
                      {promoteResults.errors.length > 0 && (
                        <span className="text-red-400"> — {promoteResults.errors.join(', ')}</span>
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Your Remixes */}
        {entries.filter(e => e.isUser).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Card className="bg-green-500/5 border-green-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-green-400" />
                  <h3 className="text-white text-sm font-semibold">Your Remixes</h3>
                </div>
                <div className="space-y-2">
                  {entries.filter(e => e.isUser).map(entry => (
                    <div key={entry.tokenId} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-xs font-bold w-6 text-center ${
                          entry.rank <= 3 ? 'text-yellow-400' : 'text-gray-500'
                        }`}>#{entry.rank}</span>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{entry.title}</p>
                          <p className="text-gray-500 text-[10px]">{entry.creator}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-white text-xs font-mono">{entry.votes.toLocaleString()}</p>
                        <p className="text-gray-500 text-[10px]">votes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard table */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-0">
            <AnimatePresence>
              {entries.map((entry, idx) => {
                const badge = RANK_BADGES[entry.rank];
                const iconic = iconicByTokenId.get(entry.tokenId);
                const isTop3 = entry.rank <= 3;
                const canPromote = isTop3 && !iconic && !isGuest;

                const showPromote = iconic || canPromote;
                return (
                  <motion.div
                    key={entry.tokenId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    {/* ═══ MOBILE: Card layout (sm:hidden) ═══ */}
                    <div className={`flex sm:hidden p-3 ${
                      isTop3 ? 'bg-yellow-400/5' : ''
                    } ${entry.isUser ? 'ring-1 ring-green-400/40 bg-green-400/5' : ''}`}>
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-8 shrink-0 text-center pt-0.5">
                          {badge ? (
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto ${badge.className}`}>
                              {badge.icon}
                            </div>
                          ) : (
                            <span className="text-gray-500 font-mono text-sm">{entry.rank}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-white font-medium text-sm truncate">{entry.title}</h3>
                            {entry.isUser && <Badge className="bg-green-500/20 text-green-300 text-[10px] border border-green-500/30">You</Badge>}
                            {iconic && <IconicMomentBadge flowNftId={iconic.flow_nft_id} flowTxHash={iconic.flow_tx_hash} status={iconic.status as any} />}
                          </div>
                          <p className="text-gray-500 text-[11px]">{entry.creator}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-white font-mono text-xs">{entry.votes.toLocaleString()}</span>
                            <span className="text-gray-500 text-[10px]">votes</span>
                            {entry.reward && (
                              <span className="text-yellow-400 font-semibold text-xs flex items-center gap-0.5">
                                <DollarSign className="h-3 w-3" />{entry.reward}
                              </span>
                            )}
                          </div>
                          {showPromote && (
                            <div className="mt-2">
                              {iconic ? (
                                <Badge className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 text-[10px] border border-blue-400/30">
                                  <Sparkles className="h-3 w-3 mr-0.5" /> Minted on Flow
                                </Badge>
                              ) : (
                                <Button
                                  onClick={() => handlePromote(entry)}
                                  disabled={isPromoting(1, entry.tokenId)}
                                  size="sm"
                                  className="h-7 text-[11px] bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-2"
                                >
                                  {isPromoting(1, entry.tokenId) ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>Promote to Flow <ArrowRight className="h-3 w-3 ml-0.5" /></>
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ═══ DESKTOP: Table row (hidden sm:flex) ═══ */}
                    <div className={`hidden sm:flex items-center gap-3 p-3 hover:bg-white/5 transition-colors ${
                      isTop3 ? 'bg-yellow-400/5' : ''
                    } ${entry.isUser ? 'ring-1 ring-green-400/40 bg-green-400/5' : ''}`}>
                      <div className="w-9 text-center shrink-0">
                        {badge ? (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${badge.className}`}>
                            {badge.icon}
                          </div>
                        ) : (
                          <span className="text-gray-500 font-mono text-base">{entry.rank}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-white font-medium text-sm truncate">{entry.title}</h3>
                          {entry.isUser && (
                            <Badge className="bg-green-500/20 text-green-300 text-[10px] border border-green-500/30">You</Badge>
                          )}
                          {iconic && (
                            <IconicMomentBadge
                              flowNftId={iconic.flow_nft_id}
                              flowTxHash={iconic.flow_tx_hash}
                              status={iconic.status as any}
                            />
                          )}
                        </div>
                        <p className="text-gray-500 text-[11px]">{entry.creator}</p>
                      </div>

                      <div className="text-right min-w-[60px] shrink-0">
                        <div className="text-white font-mono text-xs">{entry.votes.toLocaleString()}</div>
                        <div className="text-gray-500 text-[10px]">votes</div>
                      </div>

                      <div className="w-20 text-right shrink-0">
                        {entry.reward && (
                          <div className="text-yellow-400 font-semibold text-xs flex items-center justify-end gap-0.5">
                            <DollarSign className="h-3 w-3" />
                            {entry.reward}
                          </div>
                        )}
                      </div>

                      <div className="w-28 text-right shrink-0">
                        {iconic ? (
                          <Badge className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 text-[10px] border border-blue-400/30">
                            <Sparkles className="h-3 w-3 mr-0.5" />
                            Minted
                          </Badge>
                        ) : canPromote ? (
                          <Button
                            onClick={() => handlePromote(entry)}
                            disabled={isPromoting(1, entry.tokenId)}
                            size="sm"
                            className="h-7 text-[11px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 px-2"
                          >
                            {isPromoting(1, entry.tokenId) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>Promote <ArrowRight className="h-3 w-3 ml-0.5" /></>
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/remix')}
            className="px-8 py-3 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-500 transition-colors inline-flex items-center gap-2"
          >
            <Zap className="h-5 w-5" /> Create Your Remix
          </button>
        </div>
      </div>
    </div>
  );
}

const RANK_BADGES: Record<number, { icon: React.ReactNode; className: string }> = {
  1: { icon: <Trophy className="h-4 w-4" />, className: 'bg-yellow-400 text-black' },
  2: { icon: <Medal className="h-4 w-4" />, className: 'bg-gray-300 text-black' },
  3: { icon: <Medal className="h-4 w-4" />, className: 'bg-amber-600 text-white' },
};
