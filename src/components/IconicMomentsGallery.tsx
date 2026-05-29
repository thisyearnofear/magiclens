'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Sparkles, ExternalLink, RefreshCw, Trophy, Medal, Share2, Copy, Twitter } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import type { CrossVMPromotion } from '@/types/crossvm';
import { getIconicMoments, seedDemoData, closeLeaderboardDay, triggerAutoPromote } from '@/lib/crossvm-client';
import { measureUserAction } from '@/lib/action-observability';
import { TransactionProgress, type TransactionStep } from '@/components/TransactionProgress';
import { ProductJourneyHeader } from '@/components/ProductJourneyHeader';
import { useToast } from '@/hooks/use-toast';

const RANK_ICONS: Record<number, typeof Trophy> = {
  1: Trophy,
  2: Medal,
  3: Medal,
};

const RANK_COLORS: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-amber-600',
};

const flowSeedSteps: TransactionStep[] = [
  { label: 'Seed entries', description: 'Create daily leaderboard contenders.', status: 'complete' },
  { label: 'Promote top 3', description: 'Queue winners for cross-VM minting.', status: 'active' },
  { label: 'Mint on Flow', description: 'Create premium Cadence NFTs.', status: 'active' },
  { label: 'Refresh gallery', description: 'Load FlowScan-linked moments.', status: 'pending' },
];

function MomentCard({ moment }: { moment: CrossVMPromotion }) {
  const RankIcon = moment.rank <= 3 ? RANK_ICONS[moment.rank] : null;
  const rankColor = moment.rank <= 3 ? RANK_COLORS[moment.rank] : '';
  const hue = moment.rank === 1 ? 'from-yellow-400/35 via-green-500/20 to-sky-500/25' : moment.rank === 2 ? 'from-slate-200/25 via-blue-500/20 to-purple-500/25' : 'from-amber-500/25 via-rose-500/15 to-blue-500/25';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-colors h-full">
        <div className={`aspect-video relative bg-gradient-to-br ${hue} flex items-center justify-center overflow-hidden`}>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute left-6 top-8 h-24 w-24 rounded-full border border-white/15" />
          <div className="absolute right-8 top-10 h-16 w-28 skew-x-[-18deg] rounded-md border border-white/10 bg-white/5" />
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">Iconic remix</div>
              <div className="mt-1 max-w-[12rem] truncate text-lg font-black text-white">{moment.title}</div>
            </div>
            <div className="rounded-md bg-black/45 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
              #{moment.rank}
            </div>
          </div>
          {RankIcon && (
            <RankIcon className={`h-16 w-16 ${rankColor} opacity-30`} />
          )}
          <Badge
            variant={moment.status === 'minted' ? 'default' : moment.status === 'pending' ? 'secondary' : 'destructive'}
            className="absolute top-3 right-3"
          >
            {moment.status === 'minted' ? 'Minted' : moment.status === 'pending' ? 'Pending' : 'Failed'}
          </Badge>
          <Badge variant="outline" className="absolute top-3 left-3">
            Day {moment.day} · Rank #{moment.rank}
          </Badge>
        </div>

        <CardHeader>
          <CardTitle className="text-lg line-clamp-1">{moment.title}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span className="truncate font-mono text-xs">
              {moment.xlayer_creator_address.slice(0, 10)}...
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {moment.flow_nft_id != null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Flow NFT #</span>
              <span className="font-mono font-bold text-purple-400">
                {moment.flow_nft_id}
              </span>
            </div>
          )}

          {moment.flow_tx_hash && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Transaction</span>
              <a
                href={`https://testnet.flowscan.io/transaction/${moment.flow_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {moment.flow_tx_hash.slice(0, 12)}...
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {moment.flow_minted_at && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Minted</span>
              <span className="text-xs">
                {new Date(moment.flow_minted_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {moment.xlayer_token_id > 0 && (
            <div className="pt-2 border-t border-white/10">
              <a
                href={`https://www.oklink.com/x-layer-testnet/token/${moment.xlayer_token_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                X Layer Token #{moment.xlayer_token_id}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {moment.status === 'minted' && (
            <div className="pt-2 border-t border-white/10 flex gap-2">
              <button
                onClick={() => {
                  const url = `https://testnet.flowscan.io/token/${moment.flow_nft_id}`;
                  navigator.clipboard.writeText(url).then(
                    () => sonnerToast.success('Link copied!', { description: 'Flow NFT link copied to clipboard.' }),
                    () => {}
                  );
                }}
                className="flex-1 text-[11px] py-1.5 rounded bg-white/10 text-gray-300 hover:bg-white/20 transition-colors flex items-center justify-center gap-1"
              >
                <Copy className="h-3 w-3" /> Copy Link
              </button>
              <button
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?text=I+earned+a+Iconic+Moment+on+MagicLens!+Check+it+out+→&url=https://testnet.flowscan.io/token/${moment.flow_nft_id}&via=magiclensx`,
                    '_blank',
                    'noopener,noreferrer'
                  );
                }}
                className="flex-1 text-[11px] py-1.5 rounded bg-[#1DA1F2]/20 text-[#1DA1F2] hover:bg-[#1DA1F2]/30 transition-colors flex items-center justify-center gap-1"
              >
                <Twitter className="h-3 w-3" /> Share
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MomentSkeleton() {
  return (
    <Card className="overflow-hidden bg-white/5 border-white/10">
      <div className="aspect-video relative bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 flex items-center justify-center overflow-hidden">
        <div className="absolute left-6 top-8 h-24 w-24 rounded-full border border-white/5" />
        <div className="absolute right-8 top-10 h-16 w-28 skew-x-[-18deg] rounded-md border border-white/5" />
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="h-6 w-12 rounded-md" />
        </div>
        <Skeleton className="absolute top-3 right-3 h-5 w-16" />
        <Skeleton className="absolute top-3 left-3 h-5 w-24" />
      </div>
      <CardHeader>
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

export function IconicMomentsGallery() {
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const momentsQuery = useQuery({
    queryKey: ['iconic-moments', 'all'],
    queryFn: () => getIconicMoments(),
    staleTime: 15_000,
    retry: 1,
  });

  const seedMutation = useMutation({
    mutationFn: () => measureUserAction('seed_demo_data', (actionId) => seedDemoData(actionId)),
    onMutate: () => {
      setStatusMessage('Creating leaderboard entries and minting top remixes on Flow. This can take up to a minute.');
    },
    onSuccess: async (result) => {
      if (result.success) {
        if (result.iconic_moments?.length) {
          queryClient.setQueryData(['iconic-moments', 'all'], result.iconic_moments);
        }
        toast({
          title: 'Demo Data Created',
          description: `Day ${result.day}: ${result.promoted} iconic moments minted on Flow!`,
        });
        await queryClient.invalidateQueries({ queryKey: ['iconic-moments'] });
      } else {
        toast({
          title: 'Seed Failed',
          description: result.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Seed Failed',
        description: 'Could not reach backend',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setStatusMessage(null);
    },
  });

  const closeDayMutation = useMutation({
    mutationFn: async () => {
      setStatusMessage('Closing leaderboard day and promoting top entries to Flow...');
      const close = await measureUserAction('close_day_from_gallery', (actionId) =>
        closeLeaderboardDay(1, [], actionId)
      );
      if (close.success) {
        const promote = await triggerAutoPromote(1);
        return promote;
      }
      return close;
    },
    onSuccess: async (result) => {
      if (result.success) {
        toast({
          title: 'Day Closed & Promoted!',
          description: `Top entries minted as Flow Iconic Moments.`,
        });
        await queryClient.invalidateQueries({ queryKey: ['iconic-moments'] });
      } else {
        toast({
          title: 'Close Failed',
          description: result.error || 'Could not close leaderboard day',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Close Failed',
        description: 'Could not reach backend',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setStatusMessage(null);
    },
  });

  const fetchMoments = async () => {
    try {
      await measureUserAction('refresh_iconic_moments', () => momentsQuery.refetch().then((result) => {
        if (result.error) throw result.error;
        return result.data;
      }));
    } catch {
      toast({
        title: 'Refresh Failed',
        description: 'Could not reach the backend. Showing the last loaded moments.',
        variant: 'destructive',
      });
    }
  };

  const handleSeed = () => seedMutation.mutate();
  const handleCloseDay = () => closeDayMutation.mutate();
  const moments = momentsQuery.data ?? [];
  const loading = momentsQuery.isLoading;
  const refreshing = momentsQuery.isRefetching && !momentsQuery.isLoading;
  const seeding = seedMutation.isPending;
  const closing = closeDayMutation.isPending;
  const mintedCount = moments.filter((m) => m.status === 'minted').length;
  const pendingCount = moments.filter((m) => m.status === 'pending').length;

  // Scroll to top after mutations
  useEffect(() => {
    if (!loading && moments.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [seeding, closing]);

  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      <ProductJourneyHeader
        active="promote"
        title="Iconic Moments minted on Flow"
        subtitle="The top daily remixes graduate from X Layer competition into premium Cadence NFTs with explorer-linked receipts."
        metric={`${mintedCount}`}
        metricLabel="minted"
      />

      <div className="flex items-center justify-between flex-wrap gap-4 rounded-lg border border-white/10 bg-black/25 p-3">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Sparkles className="h-4 w-4 text-purple-300" />
          Flow promotion gallery
        </div>
        <div className="flex items-center gap-3">
          {mintedCount > 0 && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {mintedCount} Minted
              {pendingCount > 0 && ` · ${pendingCount} Pending`}
            </Badge>
          )}

          <Button variant="outline" size="sm" onClick={fetchMoments} loading={refreshing} disabled={loading || seeding}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Button onClick={handleSeed} loading={seeding} loadingText="Minting on Flow..." disabled={refreshing || closing}>
            <Sparkles className="h-4 w-4 mr-1" />
            Seed Demo Data
          </Button>

          <Button onClick={handleCloseDay} loading={closing} loadingText="Closing..." disabled={refreshing || seeding} variant="outline">
            <RefreshCw className="h-4 w-4 mr-1" />
            Close Day & Promote
          </Button>
        </div>
      </div>

      {statusMessage && (
        <TransactionProgress
          title="Creating Iconic Moments"
          subtitle={statusMessage}
          steps={flowSeedSteps}
        />
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <MomentSkeleton key={i} />
            ))}
          </motion.div>
        ) : moments.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>No Iconic Moments Yet</CardTitle>
                <CardDescription>
                  Iconic Moments are the top-3 daily remixes on X Layer that get promoted
                  to premium NFTs on the Flow blockchain. Click &quot;Seed Demo Data&quot; above
                  to see the cross-VM pipeline in action.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleSeed} loading={seeding} loadingText="Minting on Flow...">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Seed Demo Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LayoutGroup>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {moments.map((moment) => (
                  <MomentCard key={moment.id} moment={moment} />
                ))}
              </div>
            </LayoutGroup>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
