import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Zap, DollarSign, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useAuthContext } from '@/auth/AuthProvider';
import { getUserRemixes } from '@/lib/remix-store';
import { useIconicMoments } from '@/hooks/useIconicMoments';
import { IconicMomentBadge } from '@/components/IconicMomentBadge';
import { toast } from 'sonner';
import type { CrossVMPromotion } from '@/types/crossvm';

const DEMO_LEADERBOARD = [
  { rank: 1, title: 'Argentina Goal Messi', creator: '@fan42', votes: 2847, reward: '$30 USDT', color: 'text-yellow-400', tokenId: 1001, txHash: '0x' + 'a'.repeat(64) },
  { rank: 2, title: 'Mbappé Hat-trick Celebration', creator: '@edit_pro', votes: 2102, reward: '$20 USDT', color: 'text-gray-300', tokenId: 1002, txHash: '0x' + 'b'.repeat(64) },
  { rank: 3, title: 'Trophy Lift Celebration', creator: '@arlab', votes: 1893, reward: '$12 USDT', color: 'text-amber-600', tokenId: 1003, txHash: '0x' + 'c'.repeat(64) },
  { rank: 4, title: 'Goalkeeper Save Compilation', creator: '@goal_den', votes: 1456, reward: '$8 USDT', color: 'text-gray-400', tokenId: 1004, txHash: '0x' + 'd'.repeat(64) },
  { rank: 5, title: 'Free Kick Masterclass', creator: '@kick_master', votes: 1234, reward: '$7 USDT', color: 'text-gray-400', tokenId: 1005, txHash: '0x' + 'e'.repeat(64) },
  { rank: 6, title: 'Fan Celebration in Streets', creator: '@fan_cam', votes: 987, reward: '$6 USDT', color: 'text-gray-400', tokenId: 1006, txHash: '0x' + 'f'.repeat(64) },
  { rank: 7, title: 'Penalty Shootout Drama', creator: '@drama_edit', votes: 876, reward: '$5 USDT', color: 'text-gray-400', tokenId: 1007, txHash: '0x' + '0'.repeat(64) },
  { rank: 8, title: 'Half-time Show Highlights', creator: '@showtime', votes: 765, reward: '$5 USDT', color: 'text-gray-400', tokenId: 1008, txHash: '0x' + '1'.repeat(64) },
  { rank: 9, title: 'Referee Call Analysis', creator: '@ref_review', votes: 654, reward: '$3.50 USDT', color: 'text-gray-400', tokenId: 1009, txHash: '0x' + '2'.repeat(64) },
  { rank: 10, title: 'Post-match Interview Remix', creator: '@interview', votes: 543, reward: '$3.50 USDT', color: 'text-gray-400', tokenId: 1010, txHash: '0x' + '3'.repeat(64) },
];

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
      <header className="border-b border-white/10 bg-black/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">Today's Leaderboard</h1>
          </div>
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white text-sm">Back</button>
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
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-400">$100</div>
                <div className="text-gray-400 text-xs">Prize Pool</div>
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

        {/* Leaderboard table */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-0">
            <AnimatePresence>
              {entries.map((entry, idx) => {
                const badge = RANK_BADGES[entry.rank];
                const iconic = iconicByTokenId.get(entry.tokenId);
                const isTop3 = entry.rank <= 3;
                const canPromote = isTop3 && !iconic && !isGuest;

                return (
                  <motion.div
                    key={entry.tokenId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`flex items-center gap-3 p-3 hover:bg-white/5 transition-colors ${
                      isTop3 ? 'bg-yellow-400/5' : ''
                    } ${entry.isUser ? 'ring-1 ring-green-400/40 bg-green-400/5' : ''}`}
                  >
                    {/* Rank */}
                    <div className="w-9 text-center">
                      {badge ? (
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${badge.className}`}>
                          {badge.icon}
                        </div>
                      ) : (
                        <span className="text-gray-500 font-mono text-base">{entry.rank}</span>
                      )}
                    </div>

                    {/* Remix info */}
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

                    {/* Votes */}
                    <div className="text-right min-w-[60px]">
                      <div className="text-white font-mono text-xs">{entry.votes.toLocaleString()}</div>
                      <div className="text-gray-500 text-[10px]">votes</div>
                    </div>

                    {/* Reward */}
                    <div className="w-20 text-right">
                      {entry.reward && (
                        <div className="text-yellow-400 font-semibold text-xs flex items-center justify-end gap-0.5">
                          <DollarSign className="h-3 w-3" />
                          {entry.reward}
                        </div>
                      )}
                    </div>

                    {/* Promote action */}
                    <div className="w-28 text-right">
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
