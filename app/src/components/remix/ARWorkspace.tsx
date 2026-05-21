import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flag, Sparkles, MessageCircle, Image, ArrowRight, Eye } from 'lucide-react';

interface OverlayPack {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  selected: boolean;
  previewColor: string;
}

interface ARWorkspaceProps {
  clipTitle: string;
  onNext: (selectedPackIds: string[]) => void;
  onBack: () => void;
}

const PACKS: OverlayPack[] = [
  { id: 'flag-halos', name: 'Country Flag Halos', icon: <Flag className="h-5 w-5" />, description: '32 nation flags as player halos', selected: false, previewColor: 'from-green-500/30 to-yellow-500/30' },
  { id: 'goal-lower', name: 'GOAL! Lower-Third', icon: <Sparkles className="h-5 w-5" />, description: 'Animated GOAL! banner at bottom', selected: false, previewColor: 'from-yellow-500/30 to-red-500/30' },
  { id: 'trophy-confetti', name: 'Trophy Confetti', icon: <Image className="h-5 w-5" />, description: 'Confetti burst on trophy lift', selected: false, previewColor: 'from-purple-500/30 to-pink-500/30' },
  { id: 'commentary', name: 'Commentary Bubble', icon: <MessageCircle className="h-5 w-5" />, description: 'Commentator-style text bubble', selected: false, previewColor: 'from-blue-500/30 to-cyan-500/30' },
];

export function ARWorkspace({ clipTitle, onNext, onBack }: ARWorkspaceProps) {
  const [packs, setPacks] = useState(PACKS);

  const toggle = (id: string) => {
    setPacks(p => p.map(pk => pk.id === id ? { ...pk, selected: !pk.selected } : pk));
  };

  const selected = packs.filter(p => p.selected);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Add AR Overlays</h2>
          <p className="text-gray-400 text-sm">Select overlay packs for: <span className="text-white">{clipTitle}</span></p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onBack} className="text-white">Back</Button>
          <Button
            onClick={() => onNext(selected.map(p => p.id))}
            disabled={selected.length === 0}
            className="bg-yellow-400 text-black hover:bg-yellow-500"
          >
            Preview Remix <Eye className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video preview area */}
        <div className="lg:col-span-2">
          <div className="aspect-video bg-gray-900 rounded-xl border border-white/10 overflow-hidden relative">
            {/* Placeholder video area */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-white ml-1" style={{ borderLeftWidth: 12, borderTopWidth: 8, borderBottomWidth: 8 }} />
                </div>
                <p className="text-gray-500 text-sm">{clipTitle}</p>
                <p className="text-gray-600 text-xs mt-1">Preview with selected overlays</p>
              </div>
            </div>

            {/* Selected overlay badges */}
            {selected.map(p => (
              <div
                key={p.id}
                className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-gradient-to-r ${p.previewColor} backdrop-blur-sm border border-white/10 text-white text-xs font-medium`}
              >
                {p.name}
              </div>
            ))}
          </div>
        </div>

        {/* Pack selector */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">World Cup 2026 Packs</h3>
          {packs.map(pack => (
            <Card
              key={pack.id}
              className={`cursor-pointer transition-all ${
                pack.selected
                  ? 'bg-yellow-400/10 border-yellow-400/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              onClick={() => toggle(pack.id)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${pack.selected ? 'bg-yellow-400/20 text-yellow-400' : 'bg-white/10 text-gray-400'}`}>
                  {pack.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{pack.name}</span>
                    {pack.selected && <Badge className="bg-yellow-400 text-black text-xs">Selected</Badge>}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{pack.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
