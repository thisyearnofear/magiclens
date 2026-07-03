import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StadiumBackdrop } from '@/components/StadiumBackdrop';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Zap, DollarSign, Sparkles, ArrowRight, Clock, Database, Timer } from 'lucide-react';
import { useAuthContext } from '@/auth/AuthProvider';
import { getUserRemixes } from '@/lib/remix-store';
import { useIconicMoments } from '@/hooks/useIconicMoments';
import { IconicMomentBadge } from '@/components/IconicMomentBadge';
import { MobileNav } from '@/components/MobileNav';
import { DemoBanner } from '@/components/DemoBanner';
import { TransactionProgress, type TransactionStep, type TransactionStepStatus } from '@/components/TransactionProgress';
import { ProductJourneyHeader } from '@/components/ProductJourneyHeader';
import { toast } from 'sonner';
import { DEMO_LEADERBOARD_ENTRIES } from '@/lib/demo-data';
import { closeLeaderboardDay, triggerAutoPromote, seedDemoData } from '@/lib/crossvm-client';
import { measureUserAction } from '@/lib/action-observability';
import { useSound } from '@/hooks/useSound';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import type { CrossVMPromotion } from '@/types/crossvm';

const DEMO_LEADERBOARD = DEMO_LEADERBOARD_ENTRIES;

function cycleStepStatus(cycleStatus: 'open' | 'closed' | 'promoting' | 'completed', index: number): TransactionStepStatus {
  const current = cycleStatus === 'open' ? 0 : cycleStatus === 'closed' ? 1 : cycleStatus === 'promoting' ? 2 : 3;
  if (index < current) return 'complete';
  if (index === current) return cycleStatus === 'completed' ? 'complete' : 'active';
  return 'pending';
}

function leaderboardCycleSteps(cycleStatus: 'open' | 'closed' | 'promoting' | 'completed'): TransactionStep[] {
  return [
    { label: 'Collect votes', description: 'Leaderboard remains open for remix ranking.', status: cycleStepStatus(cycleStatus, 0) },
    { label: 'Close day', description: 'Freeze the top 10 and queue rewards.', status: cycleStepStatus(cycleStatus, 1) },
    { label: 'Promote top 3', description: 'Cross-VM scheduler mints Flow NFTs.', status: cycleStepStatus(cycleStatus, 2) },
    { label: 'Complete', description: 'Iconic Moments are visible in the gallery.', status: cycleStepStatus(cycleStatus, 3) },
  ];
}

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
  const queryClient = useQueryClient();
  const { isConnected, evmAddress, isGuest } = useAuthContext();
  const { moments, promote, isPromoting, loading: momentsLoading } = useIconicMoments({ day: 1 });
  const [entries, setEntries] = useState<LeaderboardEntry[]>(DEMO_LEADERBOARD);
  const [cycleStatus, setCycleStatus] = useState<'open' | 'closed' | 'promoting' | 'completed'>('open');
  const [promoteResults, setPromoteResults] = useState<{ promoted: number; errors: string[] } | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('');
  const [showCelebration, setShowCelebration] = useState<'promote' | 'vote' | null>(null);
  const sound = useSound();

  const closeDayMutation = useMutation({
    mutationFn: async (top10: Parameters<typeof closeLeaderboardDay>[1]) => {
      setActionStatus('Closing the leaderboard and promoting top-3 to Flow...');
      const close = await measureUserAction(
        'close_leaderboard_day',
        (actionId) => closeLeaderboardDay(1, top10, actionId),
        { day: 1, entries: top10.length }
      );
      if (close.success) {
        setActionStatus('Closing complete. Triggering cross-VM mint...');
        const promote = await triggerAutoPromote(1);
        if (promote.success) {
          return { ...close, promoted: promote.promoted ?? 0, errors: promote.errors ?? [] };
        }
      }
      return close;
    },
    onSuccess: async (result) => {
      if (result.success) {
        setCycleStatus('completed');
        setPromoteResults({ promoted: result.promoted || 3, errors: result.errors || [] });
        setActionStatus(null);
        sound.celebrate();
        setShowCelebration('promote');
        await queryClient.invalidateQueries({ queryKey: ['iconic-moments'] });
        toast.success('Day closed & promoted!', {
          description: `Top-3 entries minted as Flow Iconic Moments.`,
        });
      } else {
        setActionStatus(null);
        toast.error(result.error || 'Failed to close day');
      }
    },
    onError: () => {
      setActionStatus(null);
      toast.error('Failed to close leaderboard day');
    },
  });

  const seedDemoMutation = useMutation({
    mutationFn: () => {
      setActionStatus('Seeding demo leaderboard entries and minting top remixes on Flow...');
      return measureUserAction('seed_leaderboard_demo', (actionId) => seedDemoData(actionId), { day: 1 });
    },
    onSuccess: async (result) => {
      if (result.success) {
        setCycleStatus('completed');
        setPromoteResults({ promoted: result.promoted || 0, errors: result.errors || [] });
        setActionStatus(null);
        await queryClient.invalidateQueries({ queryKey: ['iconic-moments'] });
        toast.success(`Demo data created! Day ${result.day}: ${result.promoted} iconic moments minted.`);
      } else {
        setActionStatus(null);
        toast.error(result.error || 'Seed failed');
      }
    },
    onError: () => {
      setActionStatus(null);
      toast.error('Could not reach backend');
    },
  });

  // Countdown timer to day end (23:59 UTC)
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) { setCountdown('Closing soon...'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${h}h ${m}m left`);
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, []);

  // Inline vote tracking
  const [votedTokens, setVotedTokens] = useState<Set<number>>(new Set());
  const [voteCounts, setVoteCounts] = useState<Record<number, number>>({});

  const handleVote = (entry: LeaderboardEntry) => {
    if (votedTokens.has(entry.tokenId)) return;
    sound.vote();
    setVotedTokens(prev => new Set(prev).add(entry.tokenId));
    setEntries(prev =>
      prev.map(e =>
        e.tokenId === entry.tokenId ? { ...e, votes: e.votes + 1 } : e
      )
    );
  };

  // Scroll to top after mutations
  useEffect(() => {
    if (cycleStatus === 'completed') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [cycleStatus]);

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
      color: 'text-gray-300',
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
    const GUEST_ADDR = '0x00000000000000000000000000000000000d3m0';
    const userRemixes = getUserRemixes();
    const referredTxHashes = new Set(
      userRemixes.filter(r => r.referredBy).map(r => r.txHash)
    );
    const top10 = entries.slice(0, 10).map(e => ({
      rank: e.rank,
      title: e.title,
      creator: e.creator,
      votes: referredTxHashes.has(e.txHash) ? e.votes + 200 : e.votes,
      reward: e.reward,
      xlayer_token_id: e.tokenId,
      xlayer_tx_hash: e.txHash,
      xlayer_creator_address: evmAddress || GUEST_ADDR,
    }));
    closeDayMutation.mutate(top10);
  };

  const handleSeedDemo = async () => {
    seedDemoMutation.mutate();
  };

  const handlePromote = async (entry: LeaderboardEntry) => {
    try {
      setActionStatus(`Promoting "${entry.title}" to a Flow Iconic Moment...`);
      const GUEST_ADDR = '0x00000000000000000000000000000000000d3m0';
      await promote({
        xlayerTokenId: entry.tokenId,
        xlayerTxHash: entry.txHash,
        xlayerCreatorAddress: evmAddress || GUEST_ADDR,
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
    } finally {
      setActionStatus(null);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 sm:pb-0">
      <StadiumBackdrop opacity={0.25} />
      <div className="fixed inset-0 z-[1] bg-grid-darker pointer-events-none opacity-40" />
      <div className="relative z-[3]">
      <DemoBanner message="Preview data — real leaderboard appears when users mint and vote." />
      <header className="border-b border-white/10 bg-black/20">
        <div className="container mx-auto px-4 py-4">
          <MobileNav title="Today's Leaderboard" icon={<Trophy className="h-8 w-8 text-yellow-400 shrink-0" />} />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <ProductJourneyHeader
          active="compete"
          title="Compete for the daily promotion"
          subtitle="Every X Layer remix enters the leaderboard. Top-10 earn rewards, and the top-3 are promoted into premium Flow Iconic Moments."
          metric={countdown || 'Today'}
          metricLabel="cycle"
          className="mb-6"
        />

        {/* Prize pool + Cross-VM banner */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-yellow-400/20 to-purple-400/20 border-yellow-400/30 md:col-span-2">
            <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">World Cup 2026 — Day 1</h2>
                <p className="text-gray-300 text-sm mt-1">Top 10 remixes win daily rewards. Top 3 become Flow Iconic Moments.</p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div>
                  <div className="text-2xl font-bold text-yellow-400">8</div>
                  <div className="text-gray-300 text-xs">Iconic Moments</div>
                </div>
                {cycleStatus === 'open' && (
                  <>
                    <div className="text-[10px] text-gray-300 flex items-center gap-1">
                      <Timer className="h-3 w-3 shrink-0" />
                      <span className="truncate">Leaderboard closes in {countdown}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleSeedDemo}
                        loading={seedDemoMutation.isPending}
                        loadingText="Seeding..."
                        disabled={closeDayMutation.isPending}
                        size="sm"
                        variant="outline"
                        className="h-9 text-xs border-purple-400/30 text-purple-300 hover:bg-purple-400/10 px-3"
                      >
                        <Database className="h-3.5 w-3.5 mr-1.5" />
                        Seed Demo
                      </Button>
                      <Button
                        onClick={handleCloseDay}
                        loading={closeDayMutation.isPending}
                        loadingText={isGuest ? 'Closing...' : 'Closing...'}
                        disabled={seedDemoMutation.isPending}
                        size="sm"
                        className="h-9 text-xs bg-yellow-400 text-black hover:bg-yellow-500 border-0 px-3 font-semibold"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {isGuest ? 'Close Day (Demo)' : 'Close Day'}
                      </Button>
                    </div>
                  </>
                )}
                {cycleStatus !== 'open' && (
                  <Button
                    onClick={() => router.push('/iconic-moments')}
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs border-blue-400/30 text-blue-300 hover:bg-blue-400/10 px-3"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
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
                  <p className="text-[11px] text-gray-300 leading-relaxed">
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
            <TransactionProgress
              title={
                cycleStatus === 'completed'
                  ? 'Daily cycle completed'
                  : cycleStatus === 'promoting'
                    ? 'Promoting top remixes'
                    : 'Leaderboard closed'
              }
              subtitle={
                promoteResults
                  ? `${promoteResults.promoted} remixes promoted successfully${promoteResults.errors.length > 0 ? `; ${promoteResults.errors.join(', ')}` : ''}`
                  : 'Top-3 remixes are moving from X Layer leaderboard status into Flow Iconic Moments.'
              }
              steps={leaderboardCycleSteps(cycleStatus)}
            />
          </motion.div>
        )}

        {actionStatus && cycleStatus === 'open' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <TransactionProgress
              title="Updating leaderboard"
              subtitle={actionStatus}
              steps={leaderboardCycleSteps(cycleStatus)}
            />
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
                          entry.rank <= 3 ? 'text-yellow-400' : 'text-gray-300'
                        }`}>#{entry.rank}</span>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{entry.title}</p>
                          <p className="text-gray-300 text-[10px]">{entry.creator}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-white text-xs font-mono">{entry.votes.toLocaleString()}</p>
                        <p className="text-gray-300 text-[10px]">votes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard table */}
        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-12 text-center">
                <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white text-lg font-medium mb-2">No remixes yet</h3>
                <p className="text-gray-300 text-sm mb-6 max-w-md mx-auto">
                  Be the first to create a remix! Mint an AR overlay on X Layer and climb the daily leaderboard.
                </p>
                <Button
                  onClick={() => router.push('/remix')}
                  className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Create Your First Remix
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
        <Card className="bg-white/5 border-white/10">
          <div className="flex flex-col gap-2 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Daily rankings</h2>
              <p className="text-xs text-gray-400">Rank, reward, and Flow promotion status in one scan.</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span className="rounded bg-yellow-400/10 px-2 py-1 text-yellow-300">Top 3 promote</span>
              <span className="rounded bg-white/5 px-2 py-1">Top 10 reward</span>
            </div>
          </div>
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
                            <span className="text-gray-300 font-mono text-sm">{entry.rank}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-white font-medium text-sm truncate">{entry.title}</h3>
                            {entry.isUser && <Badge className="bg-green-500/20 text-green-300 text-[10px] border border-green-500/30">You</Badge>}
                            {iconic && <IconicMomentBadge flowNftId={iconic.flow_nft_id} flowTxHash={iconic.flow_tx_hash} status={iconic.status as any} />}
                          </div>
                          <p className="text-gray-300 text-[11px]">{entry.creator}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-white font-mono text-xs">{entry.votes.toLocaleString()}</span>
                            <span className="text-gray-300 text-[10px]">votes</span>
                            {entry.reward && (
                              <span className="text-yellow-400 font-semibold text-xs flex items-center gap-0.5">
                                <DollarSign className="h-3 w-3" />{entry.reward}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleVote(entry)}
                              disabled={votedTokens.has(entry.tokenId)}
                              className={`text-[10px] px-2 py-1 rounded font-medium transition-colors ${
                                votedTokens.has(entry.tokenId)
                                  ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                                  : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-yellow-400/20 hover:text-yellow-300'
                              }`}
                            >
                              {votedTokens.has(entry.tokenId) ? '+1 Voted' : '+1 Vote'}
                            </button>
                            {showPromote && (
                              <>
                                {iconic ? (
                                  <Badge className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 text-[10px] border border-blue-400/30">
                                    <Sparkles className="h-3 w-3 mr-0.5" /> Minted on Flow
                                  </Badge>
                                ) : (
                                  <Button
                                    onClick={() => handlePromote(entry)}
                                    loading={isPromoting(1, entry.tokenId)}
                                    loadingText="Promoting..."
                                    size="sm"
                                    className="h-7 text-[11px] bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-2"
                                  >
                                    Promote to Flow <ArrowRight className="h-3 w-3 ml-0.5" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
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
                          <span className="text-gray-300 font-mono text-base">{entry.rank}</span>
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
                        <p className="text-gray-300 text-[11px]">{entry.creator}</p>
                      </div>

                      <div className="text-right min-w-[60px] shrink-0">
                        <div className="text-white font-mono text-xs">{entry.votes.toLocaleString()}</div>
                        <div className="text-gray-300 text-[10px]">votes</div>
                      </div>

                      <div className="w-20 text-right shrink-0">
                        {entry.reward && (
                          <div className="text-yellow-400 font-semibold text-xs flex items-center justify-end gap-0.5">
                            <DollarSign className="h-3 w-3" />
                            {entry.reward}
                          </div>
                        )}
                      </div>

                      <div className="w-14 text-right shrink-0">
                        <button
                          onClick={() => handleVote(entry)}
                          disabled={votedTokens.has(entry.tokenId)}
                          className={`text-[10px] px-2 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                            votedTokens.has(entry.tokenId)
                              ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                              : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-yellow-400/20 hover:text-yellow-300'
                          }`}
                        >
                          {votedTokens.has(entry.tokenId) ? '+1 Voted' : '+1 Vote'}
                        </button>
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
                            loading={isPromoting(1, entry.tokenId)}
                            loadingText="Promoting..."
                            size="sm"
                            className="h-7 text-[11px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 px-2"
                          >
                            Promote <ArrowRight className="h-3 w-3 ml-0.5" />
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
        )}

        {/* "Beat This" Social Feed */}
        {entries.length > 0 && (
          <Card className="bg-white/5 border-white/10 mb-8">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-yellow-400" />
                <h3 className="text-sm font-semibold text-white">Beat This</h3>
                <span className="text-[11px] text-gray-300 ml-auto">Challenge other creators</span>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {entries.slice(0, 3).map(entry => (
                  <motion.div
                    key={`beat-${entry.tokenId}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-lg p-3 border border-white/5 hover:border-yellow-400/20 transition-colors"
                  >
                    <div className="text-xs font-medium text-white truncate">{entry.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-gray-300">{entry.creator}</span>
                      <span className="text-yellow-400 text-xs font-bold ml-auto">{entry.votes} pts</span>
                    </div>
                    <button
                      onClick={() => router.push('/remix')}
                      className="mt-2 w-full text-[10px] py-1.5 rounded bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 transition-colors font-medium"
                    >
                      Beat {entry.votes} pts
                    </button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

      <CelebrationOverlay
        type="promote"
        show={showCelebration === 'promote'}
        onClose={() => setShowCelebration(null)}
      />
    </div>
  );
}

const RANK_BADGES: Record<number, { icon: React.ReactNode; className: string }> = {
  1: { icon: <Trophy className="h-4 w-4" />, className: 'bg-yellow-400 text-black' },
  2: { icon: <Medal className="h-4 w-4" />, className: 'bg-gray-300 text-black' },
  3: { icon: <Medal className="h-4 w-4" />, className: 'bg-amber-600 text-white' },
};
