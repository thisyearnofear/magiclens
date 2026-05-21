import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { StepProgress } from '@/components/remix/StepProgress';
import { ClipPicker } from '@/components/remix/ClipPicker';
import ARWorkspace from '@/components/remix/ARWorkspace';
import { RemixPreview } from '@/components/remix/RemixPreview';
import { MintConfirmation } from '@/components/remix/MintConfirmation';
import { Zap } from 'lucide-react';
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
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [clip, setClip] = useState<{ title: string; id: string } | null>(null);
  const [selectedOverlays, setSelectedOverlays] = useState<SelectedOverlay[]>([]);
  const [mintTx, setMintTx] = useState<string | null>(null);
  const [leaderboardRank] = useState<number | null>(3);

  const goForward = () => { setDirection(1); setStep(s => s + 1); };
  const goBack = () => { setDirection(-1); setStep(s => s - 1); };

  const handleMint = async () => {
    // Simulate minting with a realistic-looking tx hash
    setMintTx('0x' + Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join(''));
    goForward();
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
              onClick={() => navigate('/')}
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
              onUploadNew={() => navigate('/upload-video')}
            />
          )}

          {step === 1 && clip && (
            <ARWorkspace
              clipTitle={clip.title}
              onNext={(overlays) => {
                setSelectedOverlays(overlays);
                goForward();
              }}
              onBack={goBack}
            />
          )}

          {step === 2 && clip && (
            <RemixPreview
              clipTitle={clip.title}
              packNames={selectedOverlays.map(o => OVERLAY_NAMES[o.id] || o.name)}
              onBack={goBack}
              onMint={handleMint}
            />
          )}

          {step === 3 && (
            <MintConfirmation
              txHash={mintTx}
              leaderboardRank={leaderboardRank}
              onViewLeaderboard={() => navigate('/leaderboard')}
              onCreateAnother={() => {
                setDirection(1);
                setStep(0);
                setClip(null);
                setSelectedOverlays([]);
                setMintTx(null);
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
