import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { StadiumBackdrop } from '@/components/StadiumBackdrop';
import { StepProgress } from '@/components/remix/StepProgress';
import { ProductJourneyHeader } from '@/components/ProductJourneyHeader';
import { ClipPicker } from '@/components/remix/ClipPicker';
import ARWorkspace from '@/components/remix/ARWorkspace';
import MobileARWorkspace from '@/components/remix/MobileARWorkspace';
import { useIsMobile } from '@/hooks/useIsMobile';
import { RemixPreview } from '@/components/remix/RemixPreview';
import { MintConfirmation } from '@/components/remix/MintConfirmation';
import { CheckCircle2, Sparkles, Trophy, Wand2, Zap } from 'lucide-react';
import { useAuthContext } from '@/auth';
import { useMintRemix } from '@/hooks/useMintRemix';
import { useReferrer } from '@/hooks/useReferrer';
import { addRemix } from '@/lib/remix-store';
import { claimReferral } from '@/lib/crossvm-client';
import { measureUserAction } from '@/lib/action-observability';
import type { TransactionStep, TransactionStepStatus } from '@/components/TransactionProgress';
import type { SelectedOverlay } from '@/hooks/usePack';
import type { OverlayStyle } from '@/components/remix/EditorOverlay';

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

type MintStage = 'idle' | 'metadata' | 'wallet' | 'submitted' | 'complete' | 'error';

function statusFor(stage: MintStage, index: number): TransactionStepStatus {
  const order: MintStage[] = ['metadata', 'wallet', 'submitted', 'complete'];
  const current = order.indexOf(stage);
  if (stage === 'error') return index === 3 ? 'error' : index < 3 ? 'complete' : 'pending';
  if (current === -1) return 'pending';
  if (index < current) return 'complete';
  if (index === current) return stage === 'complete' ? 'complete' : 'active';
  return 'pending';
}

function mintProgressSteps(stage: MintStage, demoMode: boolean): TransactionStep[] | undefined {
  if (stage === 'idle') return undefined;
  return [
    {
      label: demoMode ? 'Prepare demo' : 'Prepare metadata',
      description: demoMode ? 'Creating a simulated remix receipt.' : 'Uploading metadata and overlay details.',
      status: statusFor(stage, 0),
    },
    {
      label: demoMode ? 'Skip wallet' : 'Wallet approval',
      description: demoMode ? 'Demo mode does not need a signature.' : 'Confirm the transaction in your EVM wallet.',
      status: statusFor(stage, 1),
    },
    {
      label: demoMode ? 'Create receipt' : 'Submit to X Layer',
      description: demoMode ? 'Saving a local remix for leaderboard preview.' : 'Submitting the ERC-721 mint transaction.',
      status: statusFor(stage, 2),
    },
    {
      label: 'Ready',
      description: 'Your remix can now compete on the leaderboard.',
      status: statusFor(stage, 3),
    },
  ];
}

function RemixWorkflowRail({
  step,
  clipTitle,
  overlayCount,
  mintStage,
}: {
  step: number;
  clipTitle?: string;
  overlayCount: number;
  mintStage: MintStage;
}) {
  const items = [
    { label: 'Choose moment', value: clipTitle || 'No clip selected', icon: Wand2 },
    { label: 'Apply AR layer', value: overlayCount > 0 ? `${overlayCount} overlay${overlayCount > 1 ? 's' : ''}` : 'Pick overlays', icon: Sparkles },
    { label: 'Mint remix', value: mintStage === 'complete' ? 'Minted' : mintStage === 'idle' ? 'Ready after preview' : 'In progress', icon: Zap },
    { label: 'Compete', value: 'Leaderboard next', icon: Trophy },
  ];

  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-6 rounded-lg border border-white/10 bg-black/35 p-4 shadow-lg shadow-black/20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Current remix</p>
        <div className="mt-4 space-y-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isComplete = index < step;
            const isActive = index === Math.min(step, 3);
            return (
              <div key={item.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md ${
                    isComplete ? 'bg-green-500 text-white' : isActive ? 'bg-yellow-400 text-black' : 'bg-white/10 text-gray-400'
                  }`}>
                    {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  {index < items.length - 1 && <div className="mt-2 h-7 w-px bg-white/10" />}
                </div>
                <div className="min-w-0 pb-2">
                  <div className="text-sm font-semibold text-white">{item.label}</div>
                  <div className="mt-0.5 truncate text-xs text-gray-400">{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-md border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-gray-300">
          Minting on X Layer enters the daily competition. Top-3 remixes are promoted to premium Flow Iconic Moments.
        </div>
      </div>
    </aside>
  );
}

export default function RemixFlow() {
  const router = useRouter();
  const { isConnected, chain, evmAddress, isWrongNetwork } = useAuthContext();
  const { mintRemix, isMinting } = useMintRemix();
  const { referrerAddress, clearReferrer } = useReferrer();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [clip, setClip] = useState<{ title: string; id: string; videoUrl: string } | null>(null);
  const [selectedOverlays, setSelectedOverlays] = useState<SelectedOverlay[]>([]);
  const [overlayStyles, setOverlayStyles] = useState<Record<string, OverlayStyle>>({});
  const [mintTx, setMintTx] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [mintStage, setMintStage] = useState<MintStage>('idle');
  const [leaderboardRank] = useState<number | null>(null);
  const isMobile = useIsMobile();

  const goForward = () => { setDirection(1); setStep(s => s + 1); };
  const goBack = () => { setDirection(-1); setStep(s => s - 1); };

  const handleMint = async () => {
    try {
      const evmReady = isConnected && chain === 'evm' && !isWrongNetwork;
      setMintStage(evmReady ? 'metadata' : 'metadata');

      const clipTitle = clip?.title || 'Match Moment';
      const addr = evmAddress || '';
      const creator = addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '@you';

      if (evmReady) {
        const result = await measureUserAction(
          'mint_remix_xlayer',
          () => mintRemix(
            clipTitle,
            selectedOverlays.map(o => o.id),
            selectedOverlays.map(o => OVERLAY_NAMES[o.id] || o.name),
            referrerAddress,
            { onStage: setMintStage }
          ),
          { overlays: selectedOverlays.length, demo: false }
        );
        if (result) {
          const { hash, nextTokenId } = result;
          setIsDemo(false);
          setMintTx(hash);
          addRemix({ title: clipTitle, txHash: hash, creator, referredBy: referrerAddress || undefined });
          setMintStage('complete');
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
        await measureUserAction(
          'mint_remix_demo',
          async () => {
            setMintStage('metadata');
            await new Promise((resolve) => setTimeout(resolve, 350));
            setMintStage('wallet');
            await new Promise((resolve) => setTimeout(resolve, 250));
            setMintStage('submitted');
            const hash = '0x' + Array.from({ length: 64 }, () =>
              Math.floor(Math.random() * 16).toString(16)
            ).join('');
            setMintTx(hash);
            addRemix({ title: clipTitle, txHash: hash, creator, referredBy: referrerAddress || undefined });
            setMintStage('complete');
          },
          { overlays: selectedOverlays.length, demo: true }
        );
        goForward();
      }
    } catch (err) {
      setMintStage('error');
      const { toast } = await import('sonner');
      toast.error('Mint failed', { description: err instanceof Error ? err.message : 'Could not complete the mint' });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <StadiumBackdrop />
      <div className="relative z-[3]">
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
              className="text-gray-300 hover:text-white text-sm transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6">
        <ProductJourneyHeader
          active="create"
          title="Create a remix that can become iconic"
          subtitle="Pick a live-sports moment, place pose-aware AR overlays, then mint a free X Layer remix that can climb into Flow Iconic Moment status."
          metric={`${selectedOverlays.length}`}
          metricLabel="overlays"
          className="mb-5"
        />

        <div className="rounded-lg border border-white/10 bg-black/20">
          <StepProgress current={step} total={4} labels={STEP_LABELS} />
        </div>

        <div className="mt-5 flex items-start gap-5">
          <RemixWorkflowRail
            step={step}
            clipTitle={clip?.title}
            overlayCount={selectedOverlays.length}
            mintStage={mintStage}
          />

          <div className="min-w-0 flex-1">
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
                      setClip({ title: v.title || 'Match Moment', id: v.id, videoUrl: v.file_path || '' });
                      goForward();
                    }}
                    onUploadNew={() => router.push('/upload-video')}
                  />
                )}

                {step === 1 && clip && (
                  isMobile ? (
                    <MobileARWorkspace
                      clipTitle={clip.title}
                      clipVideoUrl={clip.videoUrl}
                      onNext={(overlays, styles) => {
                        setSelectedOverlays(overlays);
                        setOverlayStyles(styles);
                        goForward();
                      }}
                      onBack={goBack}
                    />
                  ) : (
                  <ARWorkspace
                    clipTitle={clip.title}
                    clipVideoUrl={clip.videoUrl}
                    onNext={(overlays, styles) => {
                      setSelectedOverlays(overlays);
                      setOverlayStyles(styles);
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
                          EVM wallet not connected. MagicLens will create a demo remix so you can continue the flow.
                        </div>
                      </div>
                    )}
                    {isConnected && chain === 'evm' && isWrongNetwork && (
                      <div className="max-w-4xl mx-auto px-4 pt-4">
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center text-orange-300 text-sm">
                          Wrong network. Switch to X Layer testnet for on-chain minting, or continue in demo mode.
                        </div>
                      </div>
                    )}
                    <RemixPreview
                      clipTitle={clip.title}
                      clipVideoUrl={clip.videoUrl}
                      selectedOverlays={selectedOverlays}
                      overlayStyles={overlayStyles}
                      onBack={goBack}
                      onMint={handleMint}
                      isMinting={isMinting}
                      progressSteps={mintProgressSteps(mintStage, !isConnected || chain !== 'evm' || isWrongNetwork)}
                      progressTitle={isConnected && chain === 'evm' && !isWrongNetwork ? 'Minting on X Layer' : 'Creating demo remix'}
                      progressSubtitle={
                        isConnected && chain === 'evm' && !isWrongNetwork
                          ? 'MagicLens is preparing metadata, waiting for wallet approval, and submitting your remix NFT.'
                          : 'Demo mode gives immediate feedback and a local leaderboard entry without an on-chain transaction.'
                      }
                    />
                  </div>
                )}

                {step === 3 && (
                  <div>
                    {isDemo && (
                      <div className="max-w-4xl mx-auto px-4 pt-4">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center text-blue-300 text-sm">
                          Demo receipt created. Connect an EVM wallet next time to mint on X Layer.
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
                        setOverlayStyles({});
                        setMintTx(null);
                        setIsDemo(false);
                        setMintStage('idle');
                      }}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
