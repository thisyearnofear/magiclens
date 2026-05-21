import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepProgress } from '@/components/remix/StepProgress';
import { ClipPicker } from '@/components/remix/ClipPicker';
import { ARWorkspace } from '@/components/remix/ARWorkspace';
import { RemixPreview } from '@/components/remix/RemixPreview';
import { MintConfirmation } from '@/components/remix/MintConfirmation';
import { Zap } from 'lucide-react';
import type { Video } from '@/lib/sdk';

const STEP_LABELS = ['Clip', 'AR Overlays', 'Preview', 'Done'];

export default function RemixFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [clip, setClip] = useState<{ title: string; id: string } | null>(null);
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [mintTx, setMintTx] = useState<string | null>(null);
  const [leaderboardRank] = useState<number | null>(3); // Demo: always rank #3

  const handleMint = async () => {
    // Simulate minting — in production this calls the RemixNFT contract
    setMintTx('0x' + Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join(''));
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">MagicLens</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Step progress */}
      <StepProgress current={step} total={4} labels={STEP_LABELS} />

      {/* Step content */}
      {step === 0 && (
        <ClipPicker
          recentClips={[]}
          onSelect={(v) => {
            setClip({ title: v.title || 'Match Moment', id: v.id });
            setStep(1);
          }}
          onUploadNew={() => navigate('/upload-video')}
        />
      )}

      {step === 1 && clip && (
        <ARWorkspace
          clipTitle={clip.title}
          onNext={(ids) => {
            setSelectedPacks(ids);
            setStep(2);
          }}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && clip && (
        <RemixPreview
          clipTitle={clip.title}
          packNames={selectedPacks.map(id => {
            const map: Record<string, string> = {
              'flag-halos': 'Flag Halos',
              'goal-lower': 'GOAL! Lower-Third',
              'trophy-confetti': 'Trophy Confetti',
              'commentary': 'Commentary Bubble',
            };
            return map[id] || id;
          })}
          onBack={() => setStep(1)}
          onMint={handleMint}
        />
      )}

      {step === 3 && (
        <MintConfirmation
          txHash={mintTx}
          leaderboardRank={leaderboardRank}
          onViewLeaderboard={() => navigate('/leaderboard')}
          onCreateAnother={() => {
            setStep(0);
            setClip(null);
            setSelectedPacks([]);
            setMintTx(null);
          }}
        />
      )}
    </div>
  );
}
