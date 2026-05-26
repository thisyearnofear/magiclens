'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Zap, Trophy, ExternalLink, Sparkles, Twitter, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function PublicRemix() {
  const { txHash } = useParams<{ txHash: string }>();
  const router = useRouter();
  const shareUrl = `https://magiclens.vercel.app/remix/${txHash}`;

  const handleTweet = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=I+just+remixed+a+World+Cup+2026+moment+on+MagicLens!+Check+it+out+→&url=${encodeURIComponent(shareUrl)}&via=MagicLensAR&hashtags=AR,WorldCup2026,NFT`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied! Share it with your friends.');
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center w-full">
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-yellow-500/30">
            <Zap className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AR Remix on MagicLens</h1>
          <p className="text-gray-400">
            This World Cup moment was remixed with AR overlays and minted as an NFT on X Layer.
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 mb-6 overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-purple-800/40 to-blue-800/40 flex items-center justify-center relative">
            <Trophy className="h-20 w-20 text-yellow-400/30" />
            <Sparkles className="h-6 w-6 text-blue-400 absolute top-4 right-4" />
            <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[10px] text-gray-400">
              <span>X Layer NFT</span>
              <span>MagicLens</span>
            </div>
          </div>
          <CardContent className="p-5 space-y-4">
            {txHash && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Transaction</span>
                  <a
                    href={`https://www.oklink.com/xlayer-testnet/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400 font-mono text-xs hover:underline flex items-center gap-1"
                  >
                    {txHash.slice(0, 10)}...{txHash.slice(-6)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Network</span>
                  <span className="text-purple-300 text-xs font-medium">X Layer Testnet</span>
                </div>
              </>
            )}

            {/* Social share row */}
            <div className="flex gap-2 pt-2 border-t border-white/10">
              <Button
                onClick={handleTweet}
                size="sm"
                className="flex-1 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white h-8 text-xs"
              >
                <Twitter className="h-3.5 w-3.5 mr-1.5" />
                Share
              </Button>
              <Button
                onClick={handleCopy}
                size="sm"
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10 h-8 text-xs"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cross-VM badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <span className="text-xs text-gray-400">
            Minted on <strong className="text-blue-300">X Layer</strong> · Promotable to <strong className="text-purple-300">Flow</strong>
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => router.push('/')}
            className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold h-11"
          >
            Create Your Own Remix
          </Button>
          <Button
            onClick={() => router.push('/iconic-moments')}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 h-10"
          >
            View Iconic Moments
          </Button>
        </div>
      </div>
    </div>
  );
}
