import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { usePack, OverlayDefinition, SelectedOverlay } from '@/hooks/usePack';
import {
  Flag, Sparkles, Image, MessageCircle, AlertTriangle,
  Check, Eye, Trophy
} from 'lucide-react';

interface MobileARWorkspaceProps {
  clipTitle: string;
  clipVideoUrl: string;
  onNext: (selected: SelectedOverlay[], styles: Record<string, { x: number; y: number; scale: number; rotation: number; opacity: number }>) => void;
  onBack: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  flag: Flag, sparkles: Sparkles, image: Image,
  'message-circle': MessageCircle, 'alert-triangle': AlertTriangle,
};

const SVG_MAP: Record<string, string> = {
  'flag-halos': '/packs/world-cup-2026/thumb-flag-halos.svg',
  'goal-lower-third': '/packs/world-cup-2026/thumb-goal-banner.svg',
  'trophy-confetti': '/packs/world-cup-2026/thumb-confetti.svg',
  'commentary-bubble': '/packs/world-cup-2026/thumb-commentary.svg',
  'stadium-sparkles': '/packs/world-cup-2026/thumb-sparkles.svg',
  'ref-card': '/packs/world-cup-2026/thumb-ref-card.svg',
};

export default function MobileARWorkspace({ clipTitle, clipVideoUrl, onNext, onBack }: MobileARWorkspaceProps) {
  const { manifest, loading } = usePack();
  const [selected, setSelected] = useState<SelectedOverlay[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [refCardColor, setRefCardColor] = useState<'yellow' | 'red'>('yellow');

  const toggleOverlay = (overlay: OverlayDefinition) => {
    setSelected(prev => {
      const exists = prev.find(s => s.id === overlay.id);
      if (exists) return prev.filter(s => s.id !== overlay.id);
      const chosenVariant = overlay.variants && overlay.variants.length > 0 ? overlay.variants[0] : null;
      return [...prev, { ...overlay, chosenVariant }];
    });
  };

  const selectVariant = (overlayId: string, variant: any) => {
    setSelected(prev => prev.map(s => s.id === overlayId ? { ...s, chosenVariant: variant } : s));
  };

  const overlays = manifest?.overlays ?? [];
  const selectedIds = new Set(selected.map(s => s.id));

  if (loading) {
    return (
      <div className="px-3 py-3 max-w-lg mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-white/10 rounded w-32" />
            <div className="h-8 bg-yellow-400/20 rounded w-32" />
          </div>
          <div className="aspect-video bg-white/5 rounded-xl" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (<div key={i} className="h-16 bg-white/5 rounded-xl" />))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-9rem)] flex flex-col max-w-lg mx-auto relative">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between shrink-0">
        <button onClick={onBack} className="text-gray-400 text-sm">Back</button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-white">AR Overlays</h2>
          <p className="text-gray-500 text-[10px]">{clipTitle}</p>
        </div>
        <Button
          onClick={() => onNext(selected, {})}
          disabled={selected.length === 0}
          size="sm"
          className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold text-xs h-8"
        >
          <Eye className="h-3 w-3 mr-1" /> Preview
        </Button>
      </div>

      {/* Video preview */}
      <div className="px-3 pb-2 shrink-0">
        <div className="aspect-video bg-gray-900 rounded-xl border border-white/10 overflow-hidden relative">
          {clipVideoUrl ? (
            <video src={clipVideoUrl} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline autoPlay />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-green-900/20 to-green-900/40 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-gray-600" />
            </div>
          )}
          {/* Show selected overlay count */}
          {selected.length > 0 && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
              {selected.length}
            </div>
          )}
        </div>
      </div>

      {/* Drawer handle */}
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        className="w-full flex justify-center py-2 shrink-0"
      >
        <motion.div
          animate={{ rotate: drawerOpen ? 0 : 180 }}
          className="w-10 h-1.5 bg-white/20 rounded-full"
        />
      </button>

      {/* Bottom sheet drawer */}
      <motion.div
        animate={{ flex: drawerOpen ? 1 : 0, opacity: drawerOpen ? 1 : 0 }}
        className="overflow-hidden"
      >
        <div className="px-3 h-full overflow-y-auto pb-6">
          <div className="flex items-center justify-between mb-2 sticky top-0 bg-gradient-to-b from-purple-900/90 via-blue-900/90 to-transparent pt-1 pb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">World Cup 2026 Packs</h3>
            <Trophy className="h-3.5 w-3.5 text-yellow-400" />
          </div>

          <div className="space-y-2">
            {overlays.map((overlay) => {
              const IconComp = ICON_MAP[overlay.icon] || Flag;
              const isSelected = selectedIds.has(overlay.id);
              const thumbSrc = SVG_MAP[overlay.id] || overlay.thumbnail;

              return (
                <motion.div
                  key={overlay.id}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => toggleOverlay(overlay)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-yellow-400/50 bg-yellow-400/10'
                        : 'border-white/10 bg-white/5 active:bg-white/10'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                      <img src={thumbSrc} alt={overlay.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${isSelected ? 'bg-yellow-400/20' : 'bg-white/10'}`}>
                          <IconComp className={`h-3 w-3 ${isSelected ? 'text-yellow-400' : 'text-gray-400'}`} />
                        </div>
                        <span className="text-white font-medium text-sm">{overlay.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-yellow-400 flex-shrink-0 ml-auto" />}
                      </div>
                      <p className="text-gray-500 text-[11px] mt-0.5">{overlay.description}</p>
                    </div>
                  </button>

                  {/* Flag halo variant picker */}
                  {isSelected && overlay.id === 'flag-halos' && overlay.variants && (
                    <div className="mt-1 ml-[60px] mr-1 flex gap-1.5 flex-wrap">
                      {overlay.variants.map((v) => {
                        const isActive = selected.find(s => s.id === 'flag-halos')?.chosenVariant?.code === v.code;
                        return (
                          <button
                            key={v.code}
                            onClick={(e) => { e.stopPropagation(); selectVariant('flag-halos', v); }}
                            className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
                              isActive ? 'border-yellow-400 scale-110' : 'border-transparent'
                            }`}
                            title={v.name}
                          >
                            {v.flagUrl && (
                              <img src={v.flagUrl} alt={v.name || ''} className="w-full h-full object-cover" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Ref-card color toggle for mobile */}
                  {isSelected && overlay.id === 'ref-card' && (
                    <div className="mt-1 ml-[60px] flex gap-2">
                      {(['yellow', 'red'] as const).map(color => {
                        const isActive = refCardColor === color;
                        return (
                          <button
                            key={color}
                            onClick={(e) => { e.stopPropagation(); setRefCardColor(color); }}
                            className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${
                              isActive
                                ? color === 'yellow'
                                  ? 'bg-yellow-400 text-black shadow'
                                  : 'bg-red-500 text-white shadow'
                                : 'bg-white/10 text-gray-300'
                            }`}
                          >
                            {color === 'yellow' ? '🟨 Yellow' : '🟥 Red'}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
