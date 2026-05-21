import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Flag, Sparkles, Image, ChevronRight, Check } from 'lucide-react';

interface QuickRemixProps {
  onNext: (selected: string[]) => void;
  onBack: () => void;
}

const PRESETS = [
  {
    id: 'flag-goal',
    name: 'Flag + Goal!',
    description: 'Nation flag halo + GOAL! banner',
    icon: <Flag className="h-6 w-6" />,
    color: 'from-yellow-400 to-red-500',
    packs: ['flag-halos', 'goal-lower-third'],
  },
  {
    id: 'celebration',
    name: 'Celebration Burst',
    description: 'Trophy confetti + commentary bubble',
    icon: <Sparkles className="h-6 w-6" />,
    color: 'from-purple-500 to-pink-500',
    packs: ['trophy-confetti', 'commentary-bubble'],
  },
  {
    id: 'atmosphere',
    name: 'Stadium Vibes',
    description: 'Sparkles + ref-card overlay',
    icon: <Image className="h-6 w-6" />,
    color: 'from-blue-500 to-cyan-500',
    packs: ['stadium-sparkles', 'ref-card'],
  },
];

const OVERLAY_NAMES: Record<string, string> = {
  'flag-halos': 'Flag Halos',
  'goal-lower-third': 'GOAL! Banner',
  'trophy-confetti': 'Trophy Confetti',
  'commentary-bubble': 'Commentary Bubble',
  'stadium-sparkles': 'Stadium Sparkles',
  'ref-card': 'Ref-Card',
};

export function QuickRemix({ onNext, onBack }: QuickRemixProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const preset = PRESETS.find(p => p.id === selectedPreset);

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-gray-400 text-sm">Back</button>
        <h2 className="text-lg font-bold text-white">Quick Remix</h2>
        <div className="w-10" />
      </div>

      {/* Preview area */}
      <div className="aspect-video bg-gray-900 rounded-xl border border-white/10 overflow-hidden relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-green-900/20 to-green-900/40 flex items-center justify-center">
          {preset ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${preset.color} flex items-center justify-center mb-3 shadow-lg`}>
                {preset.icon}
              </div>
              <p className="text-white text-sm font-semibold">{preset.name}</p>
              <div className="flex gap-1 justify-center mt-2">
                {preset.packs.map(p => (
                  <Badge key={p} className="bg-white/10 text-white text-[10px]">{OVERLAY_NAMES[p]}</Badge>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <Zap className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Tap a preset to preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Preset picker — large touch targets */}
      <div className="space-y-3 mb-6">
        {PRESETS.map(p => {
          const isSelected = selectedPreset === p.id;
          return (
            <motion.button
              key={p.id}
              onClick={() => setSelectedPreset(p.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'border-yellow-400/50 bg-yellow-400/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center flex-shrink-0`}>
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-base">{p.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-yellow-400" />}
                  </div>
                  <p className="text-gray-400 text-sm">{p.description}</p>
                </div>
                <ChevronRight className={`h-5 w-5 ${isSelected ? 'text-yellow-400' : 'text-gray-600'}`} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Confirm button — full width, prominent */}
      <Button
        onClick={() => {
          if (preset) onNext(preset.packs);
        }}
        disabled={!preset}
        className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-semibold text-lg py-6 rounded-xl"
        size="lg"
      >
        {preset ? `Use ${preset.name}` : 'Select a preset'}
      </Button>
    </div>
  );
}
