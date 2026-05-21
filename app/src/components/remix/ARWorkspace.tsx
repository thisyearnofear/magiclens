import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Flag, Sparkles, Image, MessageCircle, AlertTriangle,
  Check, Eye, Trophy, ChevronRight
} from 'lucide-react';
import { LiveDemoView } from './LiveDemoView';
import { usePack, OverlayDefinition, SelectedOverlay } from '@/hooks/usePack';

interface ARWorkspaceProps {
  clipTitle: string;
  onNext: (selected: SelectedOverlay[]) => void;
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

export default function ARWorkspace({ clipTitle, onNext, onBack }: ARWorkspaceProps) {
  const { manifest, loading } = usePack();
  const [selected, setSelected] = useState<SelectedOverlay[]>([]);
  const [hoveredPack, setHoveredPack] = useState<string | null>(null);
  const [showFlagSelector, setShowFlagSelector] = useState(false);
  const [mode, setMode] = useState<'preview' | 'live'>('preview');

  const toggleOverlay = (overlay: OverlayDefinition) => {
    setSelected(prev => {
      const exists = prev.find(s => s.id === overlay.id);
      if (exists) return prev.filter(s => s.id !== overlay.id);

      // Auto-select first variant if available
      const chosenVariant = overlay.variants && overlay.variants.length > 0
        ? overlay.variants[0] : null;

      // If it's flag halos, open the variant selector
      if (overlay.id === 'flag-halos' && overlay.variants) {
        setShowFlagSelector(true);
      }

      return [...prev, { ...overlay, chosenVariant }];
    });
  };

  const selectFlagVariant = (overlayId: string, variant: any) => {
    setSelected(prev => prev.map(s =>
      s.id === overlayId ? { ...s, chosenVariant: variant } : s
    ));
    setShowFlagSelector(false);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) return null;

  const overlays = manifest?.overlays ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-white">Add AR Overlays</h2>
          <p className="text-gray-400 text-sm">Remixing: <span className="text-white font-medium">{clipTitle}</span></p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onBack} className="text-white">Back</Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => onNext(selected)}
              disabled={selected.length === 0}
              className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
            >
              {selected.length > 0 ? (
                <>Preview Remix <Eye className="h-4 w-4 ml-2" /></>
              ) : (
                <>Select an overlay to continue <ChevronRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ VIDEO PREVIEW with mode switcher ═══ */}
        <div className="lg:col-span-2 space-y-3">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5 w-fit border border-white/5">
            <button
              onClick={() => setMode('preview')}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                mode === 'preview'
                  ? 'bg-yellow-400/20 text-yellow-300 shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>🎬</span> Simulated Preview
            </button>
            <button
              onClick={() => setMode('live')}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 relative ${
                mode === 'live'
                  ? 'bg-green-500/20 text-green-300 shadow-sm ring-1 ring-green-500/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {/* Green pulsing dot */}
              <span className={`w-2 h-2 rounded-full ${mode === 'live' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
              Live Demo
              {/* NEW badge */}
              {mode !== 'live' && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-yellow-400 text-[8px] text-black font-bold rounded-full">
                  NEW
                </span>
              )}
            </button>
          </div>

          {/* Description */}
          <p className="text-[11px] text-gray-500">
            {mode === 'preview'
              ? 'See how overlays look on a match clip with simulated pose tracking'
              : 'Real-time webcam demo — overlays follow your body using AI pose detection'
            }
          </p>

          {mode === 'preview' ? (
          <motion.div
            layout
            className="aspect-video bg-gray-900 rounded-xl border border-white/10 overflow-hidden relative"
          >
            {/* Stadium background */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-green-900/20 to-green-900/40" />

            {/* Field lines */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 border-t border-white/5">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-white/5" />
            </div>

            {/* Centered play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm"
              >
                <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-white ml-1"
                  style={{ borderLeftWidth: 12, borderTopWidth: 8, borderBottomWidth: 8 }} />
              </motion.div>
            </div>

            {/* Score overlay (always visible) */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute top-4 right-4 text-right"
            >
              <span className="inline-block px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-lg border border-white/10">
                BRA 2 — 1 ARG
              </span>
              <br />
              <span className="inline-block mt-1 px-3 py-1 bg-black/40 backdrop-blur-sm text-yellow-400 text-xs rounded-lg">
                89' Messi ⚽
              </span>
            </motion.div>

            {/* ═══ RENDERED OVERLAYS ═══ */}
            <AnimatePresence>
              {selected.map(overlay => {
                switch (overlay.id) {
                  case 'flag-halos':
                    return (
                      <motion.div
                        key="flag-halos"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        {/* Central flag halo */}
                        <div className="relative">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                            className="w-28 h-28 rounded-full border-4 border-green-400/50"
                          />
                          <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-2 rounded-full border-2 border-yellow-400/30"
                          />
                          {overlay.chosenVariant?.flagUrl ? (
                            <img
                              src={overlay.chosenVariant.flagUrl}
                              alt={overlay.chosenVariant.name}
                              className="absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)] rounded-full object-cover border-2 border-white/20 shadow-lg"
                            />
                          ) : (
                            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              WC
                            </div>
                          )}
                        </div>
                        {/* Secondary halos */}
                        <div className="absolute top-8 left-12 w-12 h-12 rounded-full border-2 border-blue-400/30" />
                        <div className="absolute bottom-12 right-16 w-10 h-10 rounded-full border-2 border-red-400/30" />
                      </motion.div>
                    );

                  case 'goal-lower-third':
                    return (
                      <motion.div
                        key="goal-lower"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className="absolute bottom-20 left-1/2 -translate-x-1/2"
                      >
                        <div className="px-8 py-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl shadow-2xl shadow-yellow-500/30 border border-yellow-300/50">
                          <motion.span
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-white font-black text-4xl tracking-[0.15em]"
                          >
                            GOAL!
                          </motion.span>
                        </div>
                      </motion.div>
                    );

                  case 'trophy-confetti':
                    return (
                      <motion.div
                        key="confetti"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 overflow-hidden"
                      >
                        {Array.from({ length: 20 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                              left: `${Math.random() * 100}%`,
                              background: ['#FFD700', '#FF4500', '#FF69B4', '#00FF88', '#00BFFF'][i % 5],
                            }}
                            animate={{
                              y: [0, 300],
                              x: [0, (Math.random() - 0.5) * 100],
                              opacity: [1, 0],
                              rotate: [0, 360],
                            }}
                            transition={{
                              duration: 2 + Math.random() * 2,
                              repeat: Infinity,
                              delay: Math.random() * 2,
                            }}
                          />
                        ))}
                      </motion.div>
                    );

                  case 'commentary-bubble':
                    return (
                      <motion.div
                        key="commentary"
                        initial={{ scale: 0, x: -50 }}
                        animate={{ scale: 1, x: 0 }}
                        exit={{ scale: 0, x: -50 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        className="absolute top-4 left-4"
                      >
                        <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-yellow-400/30 p-3 shadow-xl max-w-[200px]">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs">🎙</div>
                            <span className="text-yellow-400 text-xs font-bold">LIVE</span>
                          </div>
                          <p className="text-white text-sm leading-tight">
                            {overlay.chosenVariant?.style === 'modern'
                              ? 'Incredible strike from outside the box!'
                              : 'What a moment! The crowd goes wild!'}
                          </p>
                          <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-gray-900/80 border-r border-b border-yellow-400/30 rotate-45" />
                        </div>
                      </motion.div>
                    );

                  case 'ref-card':
                    return (
                      <motion.div
                        key="ref-card"
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 100, opacity: 0 }}
                        className="absolute top-20 right-4"
                      >
                        <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-yellow-400/40 p-3 shadow-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-6 bg-yellow-400 rounded flex items-center justify-center">
                              <span className="text-black text-xs font-bold">🟨</span>
                            </div>
                            <span className="text-white text-xs font-bold">WARNING</span>
                          </div>
                          <p className="text-gray-300 text-xs">#10 — L. Messi</p>
                        </div>
                      </motion.div>
                    );

                  case 'stadium-sparkles':
                    return (
                      <motion.div
                        key="sparkles"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0"
                      >
                        {Array.from({ length: 12 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                            style={{ left: `${8 + (i * 8)}%`, top: `${10 + (i * 7)}%` }}
                            animate={{
                              opacity: [0.2, 0.8, 0.2],
                              scale: [0.5, 1.5, 0.5],
                            }}
                            transition={{
                              duration: 1.5 + Math.random(),
                              repeat: Infinity,
                              delay: Math.random() * 2,
                            }}
                          />
                        ))}
                      </motion.div>
                    );

                  default:
                    return null;
                }
              })}
            </AnimatePresence>

            {/* Selection count badge */}
            {selected.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-4 left-4"
              >
                <Badge className="bg-yellow-400 text-black">
                  {selected.length} overlay{selected.length > 1 ? 's' : ''} active
                </Badge>
              </motion.div>
            )}
          </motion.div>
          ) : (
            <LiveDemoView selectedPackId={selected.length > 0 ? selected[0].id : null} />
          )}
        </div>

        {/* ═══ PACK SELECTOR ═══ */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">World Cup 2026 Packs</h3>
            <Trophy className="h-4 w-4 text-yellow-400" />
          </div>

          {overlays.map((overlay) => {
            const IconComp = ICON_MAP[overlay.icon] || Flag;
            const isSelected = selected.some(s => s.id === overlay.id);
            const thumbSrc = SVG_MAP[overlay.id] || overlay.thumbnail;

            return (
              <motion.div
                key={overlay.id}
                variants={itemAnim}
                onHoverStart={() => setHoveredPack(overlay.id)}
                onHoverEnd={() => setHoveredPack(null)}
              >
                <Card
                  className={`cursor-pointer transition-all overflow-hidden ${
                    isSelected
                      ? 'bg-yellow-400/10 border-yellow-400/50 ring-1 ring-yellow-400/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                  onClick={() => toggleOverlay(overlay)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                        <img src={thumbSrc} alt={overlay.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-md ${isSelected ? 'bg-yellow-400/20' : 'bg-white/10'}`}>
                            <IconComp className={`h-3.5 w-3.5 ${isSelected ? 'text-yellow-400' : 'text-gray-400'}`} />
                          </div>
                          <span className="text-white font-medium text-sm truncate">{overlay.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />}
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5 truncate">{overlay.description}</p>
                      </div>
                    </div>

                    {/* Variant picker for flag halos */}
                    {isSelected && overlay.id === 'flag-halos' && overlay.variants && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-2 pt-2 border-t border-white/10"
                      >
                        <div className="grid grid-cols-6 gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                          {overlay.variants.map((v) => {
                            const isActive = selected.find(s => s.id === 'flag-halos')?.chosenVariant?.code === v.code;
                            return (
                              <button
                                key={v.code}
                                onClick={(e) => { e.stopPropagation(); selectFlagVariant('flag-halos', v); }}
                                className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                                  isActive ? 'border-yellow-400 scale-110' : 'border-transparent hover:border-white/30'
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
                      </motion.div>
                    )}

                    {/* Selected overlays badge */}
                    {isSelected && overlay.id === 'commentary-bubble' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-2 pt-2 border-t border-white/10"
                      >
                        <div className="flex gap-2">
                          {overlay.variants?.map(v => {
                            const isActive = selected.find(s => s.id === 'commentary-bubble')?.chosenVariant?.style === v.style;
                            return (
                              <button
                                key={v.style}
                                onClick={(e) => { e.stopPropagation(); selectFlagVariant('commentary-bubble', v); }}
                                className={`px-2 py-1 text-xs rounded-md transition-all ${
                                  isActive ? 'bg-yellow-400 text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                              >
                                {v.label}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
