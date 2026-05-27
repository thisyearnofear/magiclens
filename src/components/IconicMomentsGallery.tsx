'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Sparkles, ExternalLink, RefreshCw, Trophy, Medal } from 'lucide-react';
import type { CrossVMPromotion } from '@/types/crossvm';
import { getIconicMoments, seedDemoData } from '@/lib/crossvm-client';
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

function MomentCard({ moment }: { moment: CrossVMPromotion }) {
  const RankIcon = moment.rank <= 3 ? RANK_ICONS[moment.rank] : null;
  const rankColor = moment.rank <= 3 ? RANK_COLORS[moment.rank] : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-colors h-full">
        <div className="aspect-video relative bg-gradient-to-br from-purple-900/40 to-blue-900/40 flex items-center justify-center">
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
                href={`https://www.oklink.com/xlayer-testnet/token/${moment.xlayer_token_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                X Layer Token #{moment.xlayer_token_id}
                <ExternalLink className="h-3 w-3" />
              </a>
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
      <Skeleton className="aspect-video rounded-none" />
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
  const [moments, setMoments] = useState<CrossVMPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const { toast } = useToast();

  const fetchMoments = useCallback(async () => {
    const isInitialLoad = !hasLoadedRef.current;
    setLoading(isInitialLoad);
    setRefreshing(!isInitialLoad);
    try {
      const data = await getIconicMoments();
      setMoments(data);
    } catch {
      if (isInitialLoad) setMoments([]);
      toast({
        title: 'Refresh Failed',
        description: 'Could not reach the backend. Showing the last loaded moments.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      hasLoadedRef.current = true;
    }
  }, [toast]);

  useEffect(() => {
    fetchMoments();
  }, [fetchMoments]);

  const handleSeed = async () => {
    setSeeding(true);
    setStatusMessage('Creating leaderboard entries and minting top remixes on Flow. This can take up to a minute.');
    try {
      const result = await seedDemoData();
      if (result.success) {
        if (result.iconic_moments?.length) {
          setMoments(result.iconic_moments);
        }
        toast({
          title: 'Demo Data Created',
          description: `Day ${result.day}: ${result.promoted} iconic moments minted on Flow!`,
        });
        await fetchMoments();
      } else {
        toast({
          title: 'Seed Failed',
          description: result.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Seed Failed',
        description: 'Could not reach backend',
        variant: 'destructive',
      });
    } finally {
      setSeeding(false);
      setStatusMessage(null);
    }
  };

  const mintedCount = moments.filter((m) => m.status === 'minted').length;
  const pendingCount = moments.filter((m) => m.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-purple-400" />
            Iconic Moments
          </h1>
          <p className="text-muted-foreground mt-1">
            Premium AR remixes promoted from X Layer to Flow blockchain
          </p>
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

          <Button onClick={handleSeed} loading={seeding} loadingText="Minting on Flow..." disabled={refreshing}>
            <Sparkles className="h-4 w-4 mr-1" />
            Seed Demo Data
          </Button>
        </div>
      </div>

      {statusMessage && (
        <Card className="bg-blue-500/10 border-blue-400/30">
          <CardContent className="p-3 text-sm text-blue-100">
            {statusMessage}
          </CardContent>
        </Card>
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
