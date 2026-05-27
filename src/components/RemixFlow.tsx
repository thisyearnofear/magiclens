import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { StepProgress } from '@/components/remix/StepProgress';
import { ClipPicker } from '@/components/remix/ClipPicker';
import ARWorkspace from '@/components/remix/ARWorkspace';
import { QuickRemix } from '@/components/remix/QuickRemix';
import { useIsMobile } from '@/hooks/useIsMobile';
import { RemixPreview } from '@/components/remix/RemixPreview';
import { MintConfirmation } from '@/components/remix/MintConfirmation';
import { Zap } from 'lucide-react';
import { useAuthContext } from '@/auth';
import { useMintRemix } from '@/hooks/useMintRemix';
import { useReferrer } from '@/hooks/useReferrer';
import { addRemix } from '@/lib/remix-store';
import { claimReferral } from '@/lib/crossvm-client';
import type { SelectedOverlay, OverlayDefinition } from '@/hooks/usePack';
import type { Video } from '@/lib/sdk';

const STEP_LABELS = ['Clip', 'AR Overlays', 'Preview', 'Done'];

const stepVariants = {
  initial: { opacity: 0, x: 60, scale: 0.97 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: -60, scale: 0.97, transition: { duration: 0.25, ease: 'easeIn' } },
};

// Map overlay IDs to display names
const OVERLAY_NAMES: Record<string, string> = {
  'flag-halos': 'Flag Halos',
  'goal-lower-third': 'GOAL! Lower-Third',
  'trophy-confetti': 'Trophy Confetti',
  'commentary-bubble': 'Commentary Bubble',
  'stadium-sparkles': 'Stadium Sparkles',
  'ref-card': 'Ref-Card Overlay',
};

export default function RemixFlow() {
  const router = useRouter();
  const { isConnected, chain, evmAddress, isWrongNetwork } = useAuthContext();
  const { mintRemix, isMinting } = useMintRemix();
  const { referrerAddress, clearReferrer } = useReferrer();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [clip, setClip] = useState<{ title: string; id: string } | null>(null);
  const [selectedOverlays, setSelectedOverlays] = useState<SelectedOverlay[]>([]);
  const [mintTx, setMintTx] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [leaderboardRank] = useState<number | null>(3);
  const isMobile = useIsMobile();

  const goForward = () => { setDirection(1); setStep(s => s + 1); };
  const goBack = () => { setDirection(-1); setStep(s => s - 1); };

  const handleMint = async () => {
    try {
      const evmReady = isConnected && chain === 'evm' && !isWrongNetwork;

      const clipTitle = clip?.title || 'Match Moment';
      const addr = evmAddress || '';
      const creator = addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '@you';

      if (evmReady) {
        const result = await mintRemix(
          clipTitle,
          selectedOverlays.map(o => o.id),
          selectedOverlays.map(o => OVERLAY_NAMES[o.id] || o.name),
          referrerAddress,
        );
        if (result) {
          const { hash, nextTokenId } = result;
          setIsDemo(false);
          setMintTx(hash);
          addRemix({ title: clipTitle, txHash: hash, creator, referredBy: referrerAddress || undefined });
          goForward();

          // Claim referral reward on backend
          if (referrerAddress && evmAddress && referrerAddress.toLowerCase() !== evmAddress.toLowerCase()) {
            claimReferral({
              referrerAddress,
              refereeAddress: evmAddress,
              day: 1,
              xlayerTokenId: nextTokenId,
              xlayerTxHash: hash,
            }).then(res => {
              if (res.success && res.total_referrals !== undefined) {
                import('sonner').then(({ toast }) =>
                  toast.success(`Referrer gets +${res.bonus_votes} leaderboard votes! (${res.total_referrals} total)`)
                );
              }
            });
            clearReferrer();
          }
        }
      } else {
        setIsDemo(true);
        const hash = '0x' + Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        setMintTx(hash);
        addRemix({ title: clipTitle, txHash: hash, creator, referredBy: referrerAddress || undefined });
        goForward();
      }
    } catch (err) {
      const { toast } = await import('sonner');
      toast.error('Mint failed', { description: err instanceof Error ? err.message : 'Could not complete the mint' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-white/10 bg-black/20"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
            >
              <Zap className="h-8 w-8 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">MagicLens</h1>
            </motion.div>
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      </motion.header>

      {/* Step progress */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StepProgress current={step} total={4} labels={STEP_LABELS} />
      </motion.div>

      {/* Step content with animated transitions */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          custom={direction}
        >
          {step === 0 && (
            <ClipPicker
              recentClips={[]}
              onSelect={(v) => {
                setClip({ title: v.title || 'Match Moment', id: v.id });
                goForward();
              }}
              onUploadNew={() => router.push('/upload-video')}
            />
          )}

          {step === 1 && clip && (
            isMobile ? (
              <QuickRemix
                onNext={(packIds) => {
                  setSelectedOverlays(packIds.map(id => ({ id, name: id, type: 'overlay', description: '', previewColor: '', thumbnail: '', icon: '' } as SelectedOverlay)));
                  goForward();
                }}
                onBack={goBack}
              />
            ) : (
            <ARWorkspace
              clipTitle={clip.title}
              onNext={(overlays) => {
                setSelectedOverlays(overlays);
                goForward();
              }}
              onBack={goBack}
            />
            )
          )}

          {step === 2 && clip && (
            <div>
              {(!isConnected || chain !== 'evm') && (
                <div className="max-w-4xl mx-auto px-4 pt-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center text-yellow-300 text-sm">
                    EVM wallet not connected — minting will run in demo mode.
                  </div>
                </div>
              )}
              {isConnected && chain === 'evm' && isWrongNetwork && (
                <div className="max-w-4xl mx-auto px-4 pt-4">
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center text-orange-300 text-sm">
                    Wrong network — please switch to X Layer testnet for on-chain minting.
                  </div>
                </div>
              )}
              <RemixPreview
                clipTitle={clip.title}
                packNames={selectedOverlays.map(o => OVERLAY_NAMES[o.id] || o.name)}
                onBack={goBack}
                onMint={handleMint}
                isMinting={isMinting}
              />
            </div>
          )}

          {step === 3 && (
            <div>
              {isDemo && (
                <div className="max-w-4xl mx-auto px-4 pt-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center text-blue-300 text-sm">
                    (Demo) — This transaction was simulated. Connect an EVM wallet to mint on-chain.
                  </div>
                </div>
              )}
              <MintConfirmation
                txHash={mintTx}
                leaderboardRank={leaderboardRank}
                onViewLeaderboard={() => router.push('/leaderboard')}
                onCreateAnother={() => {
                  setDirection(1);
                  setStep(0);
                  setClip(null);
                  setSelectedOverlays([]);
                  setMintTx(null);
                  setIsDemo(false);
                }}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
