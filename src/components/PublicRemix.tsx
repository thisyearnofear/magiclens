'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, ExternalLink, Sparkles, Twitter, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { usePublicClient } from 'wagmi';
import { xLayerTestnet } from 'wagmi/chains';
import { parseEventLogs } from 'viem';
import { REMIX_NFT_ABI } from '@/lib/web3/contracts';
import { getApiBaseUrl } from '@/lib/api-base';
import { decodeRemixState, type RemixState } from '@/lib/remix-state';
import { RemixReplay } from '@/components/remix/RemixReplay';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const API_BASE = getApiBaseUrl();
const TX_RE = /^0x[a-fA-F0-9]{64}$/;

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; tokenId: number | null; remixState: RemixState | null; name?: string }
  | { status: 'error' };

export default function PublicRemix() {
  const { txHash } = useParams<{ txHash: string }>();
  const router = useRouter();
  const publicClient = usePublicClient({ chainId: xLayerTestnet.id });
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const shareUrl = `https://magiclens.vercel.app/remix/${txHash}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Param is either a tx hash (share links) or a bare tokenId (metadata external_url)
        let tokenId: number | null = null;
        if (txHash && TX_RE.test(txHash) && publicClient) {
          const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
          const logs = parseEventLogs({ abi: REMIX_NFT_ABI, logs: receipt.logs as never[], eventName: 'Transfer' });
          for (const log of logs) {
            const args = log.args as { from: string; to: string; tokenId: bigint };
            if (args.from === ZERO_ADDRESS) { tokenId = Number(args.tokenId); break; }
          }
        } else if (txHash && /^\d+$/.test(txHash)) {
          tokenId = Number(txHash);
        }

        let remixState: RemixState | null = null;
        let name: string | undefined;
        if (tokenId !== null && tokenId >= 0) {
          const res = await fetch(`${API_BASE}/api/metadata/RemixNFT/${tokenId}`);
          if (res.ok) {
            const meta = await res.json();
            name = meta?.name;
            remixState = decodeRemixState(meta?.attributes);
          }
        }
        if (!cancelled) setLoad({ status: 'ready', tokenId, remixState, name });
      } catch {
        if (!cancelled) setLoad({ status: 'ready', tokenId: null, remixState: null });
      }
    })();
    return () => { cancelled = true; };
  }, [txHash, publicClient]);

  const handleTweet = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=I+just+remixed+a+sports+moment+on+MagicLens!+Check+it+out+→&url=${encodeURIComponent(shareUrl)}&via=magiclensx&hashtags=AR,Sports,NFT`,
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

  const remixState = load.status === 'ready' ? load.remixState : null;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-10">
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
          <circle cx="20%" cy="30%" r="100" fill="rgba(168,85,247,0.4)" style={{ animation: 'gooey-blob-4 14s ease-in-out infinite' }} />
          <circle cx="75%" cy="60%" r="80" fill="rgba(59,130,246,0.3)" style={{ animation: 'gooey-blob-5 16s ease-in-out infinite 3s' }} />
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
            This sports moment was remixed with AR overlays and minted as an NFT on X Layer.
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 mb-6 overflow-hidden">
          {remixState ? (
            /* Real replay — the actual clip + AR recipe from token metadata */
            <RemixReplay state={remixState} />
          ) : (
            /* Legacy fallback — mints before remix_state existed */
            <div className="aspect-video bg-gradient-to-br from-purple-800/40 via-blue-800/40 to-indigo-800/40 flex items-center justify-center relative">
              {load.status === 'loading' ? (
                <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
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
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-yellow-400/10 to-transparent"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[10px] text-gray-300">
                    <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> AR Overlays Active</span>
                    <span>X Layer NFT</span>
                  </div>
                </>
              )}
            </div>
          )}
          <CardContent className="p-5 space-y-4">
            {txHash && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{TX_RE.test(txHash) ? 'Transaction' : 'Token'}</span>
                  <a
                    href={TX_RE.test(txHash)
                      ? `https://www.oklink.com/x-layer-testnet/tx/${txHash}`
                      : `https://www.oklink.com/x-layer-testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400 font-mono text-xs hover:underline flex items-center gap-1"
                  >
                    {txHash.length > 16 ? `${txHash.slice(0, 10)}...${txHash.slice(-6)}` : `#${txHash}`}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Network</span>
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
