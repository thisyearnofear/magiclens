import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Trophy, Medal, ArrowRight, Sparkles, Share2, Copy, Twitter, Flame, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { getUserRemixes } from '@/lib/remix-store';
import { computeStreak, getStreakBadge } from '@/lib/streak';

interface MintConfirmationProps {
  txHash: string | null;
  tokenId?: number;
  leaderboardRank: number | null;
  onViewLeaderboard: () => void;
  onCreateAnother: () => void;
}

export function MintConfirmation({ txHash, tokenId, leaderboardRank, onViewLeaderboard, onCreateAnother }: MintConfirmationProps) {
  const [streak, setStreak] = useState(0);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const remixes = getUserRemixes();
    setStreak(computeStreak(remixes).current);
  }, []);

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
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center relative">
      {/* Floating sparkles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          style={{ left: `${15 + (i * 10)}%`, top: `${10 + (i * 8)}%` }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            rotate: [0, 180],
            y: [-20, -80],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          {['✨', '🌟', '💫', '⭐', '🎉', '🎊', '🏆', '⚡'][i]}
        </motion.div>
      ))}

      {/* Success check */}
      <motion.div
        className="mb-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <motion.div
          className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-500/30"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        >
          <CheckCircle className="h-12 w-12 text-white" />
        </motion.div>
        <h2 className="text-4xl font-bold text-white mb-2">Remix Minted! 🎉</h2>
        <p className="text-gray-300 text-lg">Your AR remix is now an NFT on X Layer</p>
      </motion.div>

      {/* Transaction details */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-white/5 border-white/10 mb-6 text-left">
          <CardContent className="p-5 space-y-3">
            {txHash && (
              <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-gray-300 text-sm">Transaction</span>
                <a
                  href={`https://www.oklink.com/xlayer-testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 text-sm font-mono hover:underline flex items-center gap-1"
                >
                  <motion.span
                    animate={{ opacity: [0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                  >
                    ●
                  </motion.span>
                  {' '}{txHash.slice(0, 10)}...{txHash.slice(-6)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </motion.div>
            )}
            {tokenId !== undefined && tokenId >= 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Token ID</span>
                <span className="text-white text-sm font-mono">#{tokenId}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Status</span>
              <Badge className="bg-green-600/80">Confirmed on-chain</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Network</span>
              <Badge className="bg-purple-500/80">X Layer Testnet</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Royalty</span>
              <span className="text-white text-sm">2.5% to creator</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cross-VM: Iconic Moment promotion */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 border-blue-400/30 mb-8 text-left overflow-hidden relative">
          {/* Animated gradient line */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"
            animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ backgroundSize: '200% 100%' }}
          />
          <CardContent className="p-5">
            <motion.div
              className="flex items-center gap-2 mb-3"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="h-5 w-5 text-blue-400" />
              <h3 className="text-white font-semibold">Cross-VM: X Layer → Flow</h3>
            </motion.div>
            <p className="text-gray-300 text-sm mb-3">
              {leaderboardRank && leaderboardRank <= 3
                ? `Your remix is ranked #${leaderboardRank} today! Top 3 get promoted to premium Iconic Moment NFTs on Flow Cadence — with gasless transactions and NBA Top Shot lineage.`
                : `Your remix has been submitted to today's leaderboard. Top 3 remixes are automatically promoted to Flow Iconic Moment NFTs.`}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-300 mb-3">
              <Medal className="h-4 w-4 text-blue-400" />
              <span><strong className="text-white">X Layer</strong> for volume remixes · <strong className="text-white">Flow</strong> for premium collectibles</span>
            </div>
            {/* How it works */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-blue-400/10">
              {[
                { step: '1', label: 'Mint on X Layer', desc: 'Remix minted as ERC-721' },
                { step: '2', label: 'Leaderboard', desc: 'Votes determine top 3' },
                { step: '3', label: 'Auto-promote', desc: 'Minted as Flow Cadence NFT' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold flex items-center justify-center mx-auto mb-1">
                    {item.step}
                  </div>
                  <div className="text-white text-[11px] font-medium">{item.label}</div>
                  <div className="text-gray-300 text-[10px]">{item.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Streak + Countdown */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mb-8"
      >
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className={`h-5 w-5 ${streak > 0 ? 'text-orange-400' : 'text-gray-300'}`} />
                <div>
                  <span className="text-white font-bold text-lg">{streak}</span>
                  <span className="text-gray-300 text-sm ml-1">day streak</span>
                  {getStreakBadge(streak) && (
                    <Badge variant="outline" className={`ml-2 text-[10px] ${getStreakBadge(streak)!.color} border-current`}>
                      {getStreakBadge(streak)!.icon} {getStreakBadge(streak)!.label}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-gray-300 text-xs">
                <Timer className="h-3 w-3" />
                {countdown}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Share sheet */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="h-5 w-5 text-yellow-400" />
              <h3 className="text-white font-semibold">Share Your Remix</h3>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  if (txHash) {
                    window.open(
                      `https://twitter.com/intent/tweet?text=I+just+remixed+a+World+Cup+2026+moment+on+MagicLens!+Check+it+out+→&url=https://magiclens.app/remix/${txHash}&via=magiclensx`,
                      '_blank',
                      'noopener,noreferrer'
                    );
                  }
                }}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-semibold w-full"
                disabled={!txHash}
              >
                <Twitter className="h-4 w-4 mr-2" />
                Share to X / Twitter
              </Button>
              <Button
                onClick={async () => {
                  if (!txHash) return;
                  try {
                    await navigator.clipboard.writeText(`https://magiclens.app/remix/${txHash}`);
                    toast.success('Link copied to clipboard!');
                  } catch {
                    toast.error('Could not copy link', { description: 'Clipboard access denied. Copy the URL from the address bar.' });
                  }
                }}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 w-full"
                disabled={!txHash}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex justify-center gap-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={onViewLeaderboard}
            className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
          >
            View Leaderboard <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
        <Button
          onClick={onCreateAnother}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          Create Another Remix
        </Button>
      </motion.div>
    </div>
  );
}
