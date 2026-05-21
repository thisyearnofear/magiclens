import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Trophy, Medal, ArrowRight, Sparkles } from 'lucide-react';

interface MintConfirmationProps {
  txHash: string | null;
  leaderboardRank: number | null;
  onViewLeaderboard: () => void;
  onCreateAnother: () => void;
}

export function MintConfirmation({ txHash, leaderboardRank, onViewLeaderboard, onCreateAnother }: MintConfirmationProps) {
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
        <p className="text-gray-400 text-lg">Your AR remix is now an NFT on X Layer</p>
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
                <span className="text-gray-400 text-sm">Transaction</span>
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
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Network</span>
              <Badge className="bg-purple-500/80">X Layer Testnet</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Royalty</span>
              <span className="text-white text-sm">2.5% to creator</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Leaderboard preview */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-yellow-400/10 to-purple-400/10 border-yellow-400/30 mb-8 text-left">
          <CardContent className="p-5">
            <motion.div
              className="flex items-center gap-2 mb-3"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <h3 className="text-white font-semibold">Top 3 → Flow Iconic Moments</h3>
            </motion.div>
            <p className="text-gray-300 text-sm mb-3">
              {leaderboardRank
                ? `Your remix is ranked #${leaderboardRank} today! Top 3 earn USDT rewards and become premium Iconic Moment NFTs on Flow.`
                : 'Your remix has been submitted to today\'s leaderboard. Votes coming in...'}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Medal className="h-4 w-4 text-yellow-400" />
              <span>Cross-chain by design — <strong className="text-white">X Layer</strong> for volume, <strong className="text-white">Flow</strong> for premium</span>
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
