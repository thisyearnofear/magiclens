'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Trophy, ExternalLink, Sparkles, Twitter, Copy, Play } from 'lucide-react';
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Stadium backdrop */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=80&auto=format)',
        }}
      />
      <div className="fixed inset-0 z-[1] bg-gradient-to-br from-purple-950/90 via-blue-950/85 to-indigo-950/90" />
      <svg className="fixed inset-0 z-[2] w-full h-full pointer-events-none opacity-25" aria-hidden="true">
        <defs>
          <filter id="gooey-share">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -20" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
        <g filter="url(#gooey-share)">
          <motion.circle
            cx="20%" cy="30%" r="100"
            fill="rgba(168,85,247,0.4)"
            animate={{ cx: ['20%', '30%', '20%'], cy: ['30%', '45%', '30%'] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="75%" cy="60%" r="80"
            fill="rgba(59,130,246,0.3)"
            animate={{ cx: ['75%', '65%', '75%'], cy: ['60%', '45%', '60%'] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          />
        </g>
      </svg>

      {/* Content */}
      <div className="relative z-[3] max-w-md mx-auto px-4 text-center w-full">
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-yellow-500/30">
            <Zap className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AR Remix on MagicLens</h1>
          <p className="text-gray-300">
            This World Cup moment was remixed with AR overlays and minted as an NFT on X Layer.
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 mb-6 overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-purple-800/40 via-blue-800/40 to-indigo-800/40 flex items-center justify-center relative">
            {/* Animated pose dots */}
            {[
              { x: '45%', y: '25%' }, { x: '50%', y: '32%' },
              { x: '47%', y: '50%' }, { x: '35%', y: '65%' }, { x: '58%', y: '65%' },
            ].map((dot, i) => (
              <motion.div
                key={i}
                className="absolute w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/40"
                style={{ left: dot.x, top: dot.y }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
            {/* Pose lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.line x1="45" y1="25" x2="50" y2="32" stroke="rgba(250,204,21,0.3)" strokeWidth="0.5"
                animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity }} />
              <motion.line x1="50" y1="32" x2="47" y2="50" stroke="rgba(250,204,21,0.3)" strokeWidth="0.5"
                animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
              <motion.line x1="47" y1="50" x2="35" y2="65" stroke="rgba(250,204,21,0.3)" strokeWidth="0.5"
                animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
              <motion.line x1="47" y1="50" x2="58" y2="65" stroke="rgba(250,204,21,0.3)" strokeWidth="0.5"
                animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: 0.9 }} />
            </svg>
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-yellow-400/10 to-transparent"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> AR Overlays Active</span>
              <span>X Layer NFT</span>
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
          <span className="text-xs text-gray-300">
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
