import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Trophy, Medal, ArrowRight } from 'lucide-react';

interface MintConfirmationProps {
  txHash: string | null;
  leaderboardRank: number | null;
  onViewLeaderboard: () => void;
  onCreateAnother: () => void;
}

export function MintConfirmation({ txHash, leaderboardRank, onViewLeaderboard, onCreateAnother }: MintConfirmationProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      {/* Success animation area */}
      <div className="mb-8">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Remix Minted! 🎉</h2>
        <p className="text-gray-400">Your AR remix is now an NFT on X Layer</p>
      </div>

      {/* Transaction details */}
      <Card className="bg-white/5 border-white/10 mb-6 text-left">
        <CardContent className="p-4 space-y-3">
          {txHash && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Transaction</span>
              <a
                href={`https://www.oklink.com/xlayer-testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 text-sm font-mono hover:underline flex items-center gap-1"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-6)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Network</span>
            <Badge className="bg-purple-500">X Layer Testnet</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Royalty</span>
            <span className="text-white text-sm">2.5% to creator</span>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard preview */}
      <Card className="bg-gradient-to-r from-yellow-400/10 to-purple-400/10 border-yellow-400/30 mb-8 text-left">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <h3 className="text-white font-semibold">Daily Leaderboard</h3>
          </div>
          <p className="text-gray-300 text-sm mb-3">
            {leaderboardRank
              ? `Your remix is ranked #${leaderboardRank} today! Top 3 earn USDT rewards.`
              : 'Your remix has been submitted to today\'s leaderboard. Votes coming in...'}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Medal className="h-4 w-4 text-yellow-400" />
            <span>Top 3 at midnight become <strong className="text-white">Flow Iconic Moment</strong> NFTs</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={onViewLeaderboard}
          className="bg-yellow-400 text-black hover:bg-yellow-500"
        >
          View Leaderboard <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button
          onClick={onCreateAnother}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          Create Another Remix
        </Button>
      </div>
    </div>
  );
}
