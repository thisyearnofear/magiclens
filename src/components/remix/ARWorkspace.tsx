import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Flag, Sparkles, Image, MessageCircle, AlertTriangle,
  Check, Eye, Trophy, ChevronRight, Undo2, Redo2, Sun,
  Maximize2, Minimize, Crosshair, Loader2, Download
} from 'lucide-react';
import { LiveDemoView } from './LiveDemoView';
import { EditorOverlay, InlineTextEditor, OverlayStyle } from './EditorOverlay';
import { TrackedOverlayLayer, ANCHOR_OPTIONS, type AnchorId } from './TrackedOverlayLayer';
import { usePack, OverlayDefinition, SelectedOverlay } from '@/hooks/usePack';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { useClipPoseTracker } from '@/hooks/useClipPoseTracker';
import { exportRemixVideo } from '@/lib/remix-exporter';
import { useReferrer } from '@/hooks/useReferrer';
import { toast } from 'sonner';

const DEFAULT_STYLES: Record<string, OverlayStyle> = {
  'flag-halos': { x: 240, y: 120, scale: 1, rotation: 0, opacity: 1 },
  'goal-lower-third': { x: 160, y: 380, scale: 1, rotation: 0, opacity: 1 },
  'commentary-bubble': { x: 12, y: 12, scale: 1, rotation: -3, opacity: 1, text: 'What a moment!' },
  'ref-card': { x: 510, y: 70, scale: 1, rotation: 2, opacity: 1, cardColor: 'yellow' },
  'ghost-trail': { x: 320, y: 240, scale: 1, rotation: 0, opacity: 1 },
  'player-card': { x: 500, y: 60, scale: 1, rotation: -2, opacity: 1, text: 'STAR PLAYER' },
};

interface ARWorkspaceProps {
  clipTitle: string;
  clipVideoUrl: string;
  onNext: (
    selected: SelectedOverlay[],
    styles: Record<string, OverlayStyle>,
    sourceSize?: { w: number; h: number },
    replay?: { mode: 'track' | 'static'; anchors: Record<string, AnchorId>; subjectId?: number },
  ) => void;
  onBack: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  flag: Flag, sparkles: Sparkles, image: Image,
  'message-circle': MessageCircle, 'alert-triangle': AlertTriangle,
};

const SVG_MAP: Record<string, string> = {
  'flag-halos': '/packs/match-day/thumb-flag-halos.svg',
  'goal-lower-third': '/packs/match-day/thumb-goal-banner.svg',
  'trophy-confetti': '/packs/match-day/thumb-confetti.svg',
  'commentary-bubble': '/packs/match-day/thumb-commentary.svg',
  'stadium-sparkles': '/packs/match-day/thumb-sparkles.svg',
  'ref-card': '/packs/match-day/thumb-ref-card.svg',
  'ghost-trail': '/packs/match-day/thumb-ghost-trail.svg',
  'player-card': '/packs/match-day/thumb-player-card.svg',
};

/** Simple undo/redo stack for overlay styles */
function useUndoStack<T extends Record<string, OverlayStyle>>(
  initial: T,
  set: React.Dispatch<React.SetStateAction<T>>,
) {
  const [undoStack, setUndoStack] = useState<T[]>([]);
  const [redoStack, setRedoStack] = useState<T[]>([]);

  const push = useCallback(
    (next: T) => {
      setUndoStack(prev => [...prev.slice(-49), next]);
      setRedoStack([]);
    },
    [],
  );

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack(r => [...r, last]);
      set(last);
      return prev.slice(0, -1);
    });
  }, [set]);

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const next = prev[prev.length - 1];
      setUndoStack(u => [...u, next]);
      set(next);
      return prev.slice(0, -1);
    });
  }, [set]);

  return { push, undo, redo, canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 };
}

export default function ARWorkspace({ clipTitle, clipVideoUrl, onNext, onBack }: ARWorkspaceProps) {
  const { manifest, loading } = usePack();
  const [selected, setSelected] = useState<SelectedOverlay[]>([]);
  const [styles, setStyles] = useState<Record<string, OverlayStyle>>({});
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const [mode, setMode] = useState<'preview' | 'live' | 'track'>('preview');
  const tracker = useClipPoseTracker(clipVideoUrl || null);
  const {
    status: trackStatus,
    progress: trackProgress,
    error: trackError,
    poseAt,
    subjectsAt,
    tracks,
    selectedTrackId,
    setSelectedTrackId,
    track: startTracking,
  } = tracker;
  const [anchorOverrides, setAnchorOverrides] = useState<Record<string, AnchorId>>({});
  const [exportState, setExportState] = useState<'idle' | 'recording' | 'done' | 'error'>('idle');
  const replayMode: 'track' | 'static' = mode === 'track' ? 'track' : 'static';
  const { referrerAddress } = useReferrer();
  const [exportProgress, setExportProgress] = useState(0);
  const trackVideoRef = React.useRef<HTMLVideoElement | null>(null);

  const handleExport = useCallback(async () => {
    const video = trackVideoRef.current;
    if (!video || exportState === 'recording') return;
    setExportState('recording');
    setExportProgress(0);
    try {
      const result = await exportRemixVideo({
        video,
        overlays: selected,
        anchors: anchorOverrides,
        texts: Object.fromEntries(selected.map((o) => [o.id, styles[o.id]?.text ?? '']).filter(([, v]) => v)),
        opacities: Object.fromEntries(selected.map((o) => [o.id, styles[o.id]?.opacity ?? 1])),
        poseAt,
        onProgress: setExportProgress,
        // Seeded creators (arrived via a ?ref= link) get clean exports — see docs/MONETIZATION.md
        watermark: !referrerAddress,
      });
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `magiclens-remix.${result.extension}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setExportState('done');
      toast.success('Remix exported', {
        description: `${result.extension.toUpperCase()} · ${result.duration.toFixed(0)}s — ready to post.`,
      });
      setTimeout(() => setExportState('idle'), 4000);
    } catch (e) {
      setExportState('error');
      toast.error('Export failed', {
        description: e instanceof Error ? e.message : 'Recording is not supported in this browser',
      });
      setTimeout(() => setExportState('idle'), 4000);
    }
  }, [exportState, selected, anchorOverrides, styles, poseAt, trackVideoRef, referrerAddress]);

  // Kick off clip pose analysis when Track mode is entered
  React.useEffect(() => {
    if (mode === 'track' && trackStatus === 'idle') startTracking();
  }, [mode, trackStatus, startTracking]);

  // Bridge pose tracking → editor styles when in Live Demo mode
  const handlePoseUpdate = useCallback(
    (posePositions: { head: { x: number; y: number } | null; leftShoulder: { x: number; y: number } | null; rightShoulder: { x: number; y: number } | null; leftWrist: { x: number; y: number } | null; rightWrist: { x: number; y: number } | null }) => {
      if (mode !== 'live') return;
      setStyles(prev => {
        const next = { ...prev };
        if (posePositions.head) {
          if (selected.some(s => s.id === 'flag-halos')) {
            next['flag-halos'] = { ...(next['flag-halos'] ?? DEFAULT_STYLES['flag-halos']!), x: posePositions.head.x - 56, y: posePositions.head.y - 56 };
          }
          if (selected.some(s => s.id === 'goal-lower-third')) {
            next['goal-lower-third'] = { ...(next['goal-lower-third'] ?? DEFAULT_STYLES['goal-lower-third']!), x: posePositions.head.x - 80, y: posePositions.head.y + 10 };
          }
        }
        if (posePositions.leftShoulder && selected.some(s => s.id === 'commentary-bubble')) {
          next['commentary-bubble'] = { ...(next['commentary-bubble'] ?? DEFAULT_STYLES['commentary-bubble']!), x: posePositions.leftShoulder.x + 20, y: posePositions.leftShoulder.y - 60 };
        }
        if (posePositions.rightShoulder && selected.some(s => s.id === 'ref-card')) {
          next['ref-card'] = { ...(next['ref-card'] ?? DEFAULT_STYLES['ref-card']!), x: posePositions.rightShoulder.x - 70, y: posePositions.rightShoulder.y - 25 };
        }
        return next;
      });
    },
    [mode, selected],
  );

  const { push, undo, redo, canUndo, canRedo } = useUndoStack(styles, setStyles);
  const { elementRef, isFullscreen, controlsVisible, setControlsVisible, toggle } = useFullscreen();

  const handleStyleChange = useCallback(
    (id: string, partial: Partial<OverlayStyle>) => {
      setStyles(prev => {
        const next = { ...prev, [id]: { ...(prev[id] ?? DEFAULT_STYLES[id] ?? { x: 200, y: 180, scale: 1, rotation: 0, opacity: 1 }), ...partial } };
        push(next);
        return next;
      });
    },
    [push],
  );

  const handleOpacityChange = useCallback(
    (id: string, value: number) => {
      setStyles(prev => {
        const next = { ...prev, [id]: { ...(prev[id] ?? DEFAULT_STYLES[id] ?? { x: 200, y: 180, scale: 1, rotation: 0, opacity: 1 }), opacity: value } };
        push(next);
        return next;
      });
    },
    [push],
  );

  const handleRemoveOverlay = useCallback((id: string) => {
    setSelected(prev => prev.filter(s => s.id !== id));
    setSelectedOverlayId(cur => (cur === id ? null : cur));
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedOverlayId(null);
  }, []);

  const handleDoubleClick = useCallback((id: string) => {
    // Open inline text editor for text-bearing overlays
    if (id === 'commentary-bubble' || id === 'player-card') {
      setEditingOverlayId(id);
    }
  }, []);

  const toggleOverlay = (overlay: OverlayDefinition) => {
    setSelected(prev => {
      const exists = prev.find(s => s.id === overlay.id);
      if (exists) {
        setSelectedOverlayId(cur => (cur === overlay.id ? null : cur));
        return prev.filter(s => s.id !== overlay.id);
      }

      if (!styles[overlay.id]) {
        const defaultStyle = DEFAULT_STYLES[overlay.id] ?? { x: 200, y: 180, scale: 1, rotation: 0, opacity: 1 };
        setStyles(s => ({ ...s, [overlay.id]: defaultStyle }));
      }

      const chosenVariant = overlay.variants && overlay.variants.length > 0
        ? overlay.variants[0] : null;

      return [...prev, { ...overlay, chosenVariant }];
    });
  };

  const selectVariant = (overlayId: string, variant: any) => {
    setSelected(prev => prev.map(s =>
      s.id === overlayId ? { ...s, chosenVariant: variant } : s
    ));
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemAnim = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <div className="h-7 bg-white/10 rounded w-48" />
              <div className="h-4 bg-white/5 rounded w-64" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 bg-white/10 rounded w-16" />
              <div className="h-9 bg-yellow-400/20 rounded w-40" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="aspect-video bg-white/5 rounded-xl" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (<div key={i} className="h-20 bg-white/5 rounded-xl" />))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const overlays = manifest?.overlays ?? [];
  const selectedStyle = selectedOverlayId ? styles[selectedOverlayId] : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white">Add AR Overlays</h2>
            <p className="text-gray-300 text-sm">Remixing: <span className="text-white font-medium">{clipTitle}</span></p>
          </div>
          {/* Undo/Redo */}
          <div className="flex gap-1 ml-4">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              <Undo2 className="h-3.5 w-3.5 text-gray-300" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Redo"
            >
              <Redo2 className="h-3.5 w-3.5 text-gray-300" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="ghost" onClick={onBack} className="text-white whitespace-nowrap">Back</Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => { const r = elementRef.current; onNext(selected, styles, r ? { w: r.clientWidth, h: r.clientHeight } : undefined, { mode: replayMode, anchors: anchorOverrides, subjectId: selectedTrackId }); }}
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
        {/* ═══ VIDEO PREVIEW ═══ */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-3">
            {/* Mode tabs */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-0.5 w-fit border border-white/5">
              <button
                onClick={() => setMode('preview')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  mode === 'preview' ? 'bg-yellow-400/20 text-yellow-300 shadow-sm' : 'text-gray-300 hover:text-gray-300'
                }`}
              >
                <span>🎬</span> Editor
              </button>
              <button
                onClick={() => setMode('live')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 relative ${
                  mode === 'live' ? 'bg-green-500/20 text-green-300 shadow-sm ring-1 ring-green-500/30' : 'text-gray-300 hover:text-gray-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${mode === 'live' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                Live Demo
              </button>
              <button
                onClick={() => setMode('track')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 relative ${
                  mode === 'track' ? 'bg-purple-500/20 text-purple-300 shadow-sm ring-1 ring-purple-500/30' : 'text-gray-300 hover:text-gray-300'
                }`}
                title="Overlays follow the player through the clip"
              >
                <Crosshair className={`h-3 w-3 ${mode === 'track' ? 'text-purple-400' : 'text-gray-600'}`} />
                Track Player
              </button>
              {/* Fullscreen toggle */}
              <button
                onClick={toggle}
                className="px-2 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 text-gray-300 hover:bg-white/10"
                title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen (F)'}
              >
                {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Opacity slider for selected overlay */}
            {selectedOverlayId && selectedStyle && (
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/5 ml-auto">
                <Sun className="h-3.5 w-3.5 text-gray-300" />
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={selectedStyle.opacity}
                  onChange={(e) => handleOpacityChange(selectedOverlayId, parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400"
                />
                <span className="text-[10px] text-gray-300 w-8 text-right font-mono">
                  {Math.round(selectedStyle.opacity * 100)}%
                </span>
              </div>
            )}
          </div>

          {mode === 'preview' ? (
            <motion.div
              ref={elementRef}
              layout
              className="aspect-video bg-gray-900 rounded-xl border border-white/10 overflow-hidden relative group"
            >
              {/* Tap target — hold to reveal, release to hide */}
              {isFullscreen && (
                <div
                  onPointerDown={() => setControlsVisible(true)}
                  onPointerUp={() => setControlsVisible(false)}
                  className="absolute inset-0 z-10 cursor-default"
                />
              )}

              {/* Dark overlay transition — visible only when controls are shown */}
              <AnimatePresence>
                {controlsVisible && (
                  <motion.div
                    key="fullscreen-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="absolute inset-0 z-20 bg-black/60 pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* Floating toolbar — visible only when controls are shown */}
              <AnimatePresence>
                {controlsVisible && (
                  <motion.div
                    key="fullscreen-toolbar"
                    initial={{ y: -24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -24, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent"
                  >
                    <div>
                      <button
                        onClick={toggle}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-medium backdrop-blur-sm"
                      >
                        <Minimize className="h-3.5 w-3.5" />
                        Exit <span className="text-white/40 ml-1">Esc</span>
                      </button>
                    </div>

                    <div className="flex-1" />

                    {selectedOverlayId && selectedStyle && (
                      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5">
                        <Sun className="h-3 w-3 text-yellow-400" />
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={selectedStyle.opacity}
                          onChange={(e) => handleOpacityChange(selectedOverlayId, parseFloat(e.target.value))}
                          className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400"
                        />
                        <span className="text-[10px] text-white/80 w-8 text-right font-mono">
                          {Math.round(selectedStyle.opacity * 100)}%
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="text-xs text-white/60 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                        {selected.length} overlay{selected.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div>
                      <button
                        onClick={() => { const r = elementRef.current; onNext(selected, styles, r ? { w: r.clientWidth, h: r.clientHeight } : undefined, { mode: replayMode, anchors: anchorOverrides, subjectId: selectedTrackId }); }}
                        disabled={selected.length === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 text-black hover:bg-yellow-500 font-semibold text-xs transition-colors disabled:opacity-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {clipVideoUrl ? (
                  <motion.video
                    key="video"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    src={clipVideoUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted loop playsInline autoPlay
                  />
                ) : (
                  <motion.div
                    key="fallback"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-b from-gray-900 via-green-900/20 to-green-900/40"
                  />
                )}
              </AnimatePresence>

              {clipVideoUrl ? (
                <video
                  src={clipVideoUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted loop playsInline autoPlay
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-green-900/20 to-green-900/40" />
              )}

              <div className="absolute inset-0 z-0" onClick={handleCanvasClick} />

              <AnimatePresence>
                {selected.map(overlay => {
                  const st = styles[overlay.id] ?? DEFAULT_STYLES[overlay.id] ?? { x: 200, y: 180, scale: 1, rotation: 0, opacity: 1 };
                  const isSel = selectedOverlayId === overlay.id;

                  const wrap = (children: React.ReactNode) => (
                    <EditorOverlay
                      key={overlay.id}
                      overlayId={overlay.id}
                      style={st}
                      onStyleChange={handleStyleChange}
                      isSelected={isSel}
                      onSelect={setSelectedOverlayId}
                      onRemove={handleRemoveOverlay}
                      onDoubleClick={handleDoubleClick}
                    >
                      {children}
                    </EditorOverlay>
                  );

                  switch (overlay.id) {
                    case 'flag-halos':
                      return wrap(
                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
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
                                alt={overlay.chosenVariant.name || ''}
                                className="absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)] rounded-full object-cover border-2 border-white/20 shadow-lg"
                              />
                            ) : (
                              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">WC</div>
                            )}
                          </div>
                        </motion.div>,
                      );

                    case 'goal-lower-third':
                      return wrap(
                        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
                          <div className="px-8 py-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl shadow-2xl shadow-yellow-500/30 border border-yellow-300/50">
                            <motion.span
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="text-white font-black text-4xl tracking-[0.15em] whitespace-nowrap"
                            >
                              GOAL!
                            </motion.span>
                          </div>
                        </motion.div>,
                      );

                    case 'trophy-confetti':
                      return (
                        <motion.div key="confetti" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-hidden pointer-events-none">
                          {Array.from({ length: 20 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 rounded-full"
                              style={{ left: `${Math.random() * 100}%`, background: ['#FFD700', '#FF4500', '#FF69B4', '#00FF88', '#00BFFF'][i % 5] }}
                              animate={{ y: [0, 300], x: [0, (Math.random() - 0.5) * 100], opacity: [1, 0], rotate: [0, 360] }}
                              transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                            />
                          ))}
                        </motion.div>
                      );

                    case 'commentary-bubble':
                      return wrap(
                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                          <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-yellow-400/30 p-3 shadow-xl max-w-[200px] relative cursor-text">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px]">🎙</div>
                              <span className="text-yellow-400 text-[10px] font-bold">LIVE</span>
                              {isSel && (
                                <span className="text-[8px] text-gray-300 ml-auto">✏️ dbl-click</span>
                              )}
                            </div>
                            <p className="text-white text-sm leading-tight">
                              {st.text || 'What a moment!'}
                            </p>
                            <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-gray-900/80 border-r border-b border-yellow-400/30 rotate-45" />
                          </div>
                        </motion.div>,
                      );

                    case 'ref-card':
                      return wrap(
                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                          <div className={`backdrop-blur-md rounded-xl border p-3 shadow-xl ${
                            st.cardColor === 'red' ? 'bg-red-900/70 border-red-400/40' : 'bg-gray-900/80 border-yellow-400/40'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-6 h-4 rounded flex items-center justify-center ${
                                st.cardColor === 'red' ? 'bg-red-500' : 'bg-yellow-400'
                              }`}>
                                <span className="text-black text-[10px] font-bold">{st.cardColor === 'red' ? 'RED' : 'YLW'}</span>
                              </div>
                              <span className="text-white text-xs font-bold">WARNING</span>
                            </div>
                            <p className="text-gray-300 text-xs">#10 — Player</p>
                          </div>
                        </motion.div>,
                      );

                    case 'ghost-trail':
                      return (
                        <motion.div key="ghost" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none">
                          {[0.12, 0.3, 0.55, 0.85].map((o, i) => (
                            <motion.div
                              key={i}
                              className="absolute text-cyan-200"
                              style={{ left: `${20 + i * 18}%`, top: `${55 - i * 8}%`, opacity: o }}
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
                            >
                              <svg width="28" height="44" viewBox="0 0 28 44" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <circle cx="14" cy="6" r="4" fill="currentColor" stroke="none" />
                                <line x1="14" y1="10" x2="14" y2="26" />
                                <line x1="14" y1="14" x2="5" y2="22" />
                                <line x1="14" y1="14" x2="23" y2="22" />
                                <line x1="14" y1="26" x2="7" y2="40" />
                                <line x1="14" y1="26" x2="21" y2="40" />
                              </svg>
                            </motion.div>
                          ))}
                        </motion.div>
                      );

                    case 'player-card': {
                      const accent = overlay.chosenVariant?.accent ?? '#FFD700';
                      return wrap(
                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                          <div className="bg-gray-900/85 backdrop-blur-md rounded-xl px-3 py-2.5 shadow-xl w-40 cursor-text" style={{ border: `1.5px solid ${accent}66` }}>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-5 rounded-sm flex items-center justify-center text-[10px] font-black text-black" style={{ background: accent }}>10</div>
                              <span className="text-[10px] font-bold" style={{ color: accent }}>RATING</span>
                              <span className="ml-auto text-white text-sm font-black">9.4</span>
                            </div>
                            <p className="text-white text-xs font-bold mt-1.5 leading-tight whitespace-nowrap">
                              {st.text || 'STAR PLAYER'}
                              {isSel && <span className="text-[8px] text-gray-400 ml-1">✏️</span>}
                            </p>
                            <div className="mt-1.5 space-y-1">
                              <div className="h-1 rounded-full bg-white/15 overflow-hidden"><div className="h-full w-[86%] rounded-full" style={{ background: accent }} /></div>
                              <div className="h-1 rounded-full bg-white/15 overflow-hidden"><div className="h-full w-[64%] rounded-full bg-sky-400" /></div>
                            </div>
                          </div>
                        </motion.div>,
                      );
                    }

                    case 'stadium-sparkles':
                      return (
                        <motion.div key="sparkles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                              style={{ left: `${8 + (i * 8)}%`, top: `${10 + (i * 7)}%` }}
                              animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.5, 1.5, 0.5] }}
                              transition={{ duration: 1.5 + Math.random(), repeat: Infinity, delay: Math.random() * 2 }}
                            />
                          ))}
                        </motion.div>
                      );

                    default:
                      return null;
                  }
                })}
              </AnimatePresence>

              {/* Status bar */}
              {selected.length > 0 && !isFullscreen && (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-3 left-3 z-30">
                    <Badge className="bg-yellow-400 text-black font-medium">
                      {selected.length} overlay{selected.length > 1 ? 's' : ''}
                    </Badge>
                  </motion.div>
                  <div className="absolute bottom-3 right-3 z-30">
                    <span className="text-[9px] text-gray-300 bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
                      Click to select · Drag to move · Corners to resize · ↻ to rotate · ⌘Z to undo
                    </span>
                  </div>
                </>
              )}

              {/* Inline text editor modal */}
              {editingOverlayId && (
                <InlineTextEditor
                  text={styles[editingOverlayId]?.text || (editingOverlayId === 'player-card' ? 'STAR PLAYER' : 'What a moment!')}
                  onSave={(text) => {
                    handleStyleChange(editingOverlayId, { text });
                    setEditingOverlayId(null);
                  }}
                  onCancel={() => setEditingOverlayId(null)}
                />
              )}
            </motion.div>
          ) : mode === 'track' ? (
            <div className="space-y-3">
              {/* Track status bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {trackStatus === 'ready' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      <span className="text-sm font-medium text-purple-300">Pose tracking active — overlays follow the player</span>
                    </>
                  ) : trackStatus === 'tracking' || trackStatus === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-purple-300" />
                      <span className="text-sm font-medium text-purple-300">
                        {trackStatus === 'loading' ? 'Loading pose model...' : `Analyzing poses… ${Math.round(trackProgress * 100)}%`}
                      </span>
                    </>
                  ) : trackStatus === 'error' ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-sm font-medium text-red-300">{trackError}</span>
                    </>
                  ) : (
                    <>
                      <Crosshair className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-400">Track a player in this clip</span>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {trackStatus === 'error' && (
                    <Button onClick={startTracking} size="sm" className="bg-yellow-400 text-black hover:bg-yellow-500">
                      Retry
                    </Button>
                  )}
                  {trackStatus === 'ready' && (
                    <>
                      <Button onClick={startTracking} size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        Re-analyze
                      </Button>
                      {selected.length > 0 && (
                        <Button
                          onClick={handleExport}
                          disabled={exportState === 'recording'}
                          size="sm"
                          className="bg-yellow-400 text-black hover:bg-yellow-500"
                        >
                          {exportState === 'recording' ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              {Math.round(exportProgress * 100)}%
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              {exportState === 'done' ? 'Exported!' : 'Export video'}
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Analysis progress */}
              {trackStatus === 'tracking' && (
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400"
                    animate={{ width: `${trackProgress * 100}%` }}
                    transition={{ ease: 'easeOut', duration: 0.3 }}
                  />
                </div>
              )}

              <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-purple-500/20">
                {clipVideoUrl ? (
                  <video
                    ref={trackVideoRef}
                    src={clipVideoUrl}
                    crossOrigin="anonymous"
                    className="absolute inset-0 w-full h-full object-cover"
                    muted loop playsInline autoPlay controls={trackStatus === 'ready'}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-green-900/20 to-green-900/40" />
                )}

                {trackStatus === 'ready' && selected.length > 0 && (
                  <TrackedOverlayLayer
                    videoRef={trackVideoRef}
                    poseAt={poseAt}
                    subjectsAt={subjectsAt}
                    selectedSubjectId={selectedTrackId}
                    onSelectSubject={setSelectedTrackId}
                    overlays={selected}
                    opacities={Object.fromEntries(selected.map(o => [o.id, styles[o.id]?.opacity ?? 1]))}
                    anchors={anchorOverrides}
                    texts={Object.fromEntries(selected.map(o => [o.id, styles[o.id]?.text ?? '']).filter(([, v]) => v))}
                  />
                )}

                {/* Empty state */}
                {trackStatus === 'ready' && selected.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                    <p className="text-gray-300 text-sm">Select an overlay — it will follow the player</p>
                  </div>
                )}

                {/* Loading overlay */}
                {(trackStatus === 'loading' || trackStatus === 'tracking') && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
                    <div className="text-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                        <Crosshair className="h-10 w-10 text-purple-400 mx-auto mb-3" />
                      </motion.div>
                      <p className="text-white text-sm font-medium">
                        {trackStatus === 'loading' ? 'Loading Pose AI...' : 'Tracking player...'}
                      </p>
                      <p className="text-gray-400 text-xs mt-1 max-w-[260px]">
                        {trackStatus === 'loading'
                          ? 'Downloading MediaPipe model (one-time)'
                          : 'Scanning each frame for pose landmarks — overlays will lock on'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Subject + anchor controls */}
              {trackStatus === 'ready' && selected.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {tracks.length > 1 && (
                    <span className="text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full px-2.5 py-1">
                      {tracks.length} players found — tap a dot to switch
                    </span>
                  )}
                  {selected.map((o) => (
                    <label
                      key={o.id}
                      className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-gray-300"
                    >
                      <span className="text-gray-500">{o.name.split(' ')[0]}</span>
                      <select
                        value={anchorOverrides[o.id] ?? 'auto'}
                        onChange={(e) =>
                          setAnchorOverrides((prev) => ({ ...prev, [o.id]: e.target.value as AnchorId }))
                        }
                        className="bg-transparent text-purple-300 font-medium outline-none cursor-pointer [&>option]:bg-gray-900"
                      >
                        {ANCHOR_OPTIONS.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <LiveDemoView
              selectedOverlayIds={selected.map(s => s.id)}
              onPoseUpdate={handlePoseUpdate}
              fullscreenRef={elementRef}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggle}
              controlsVisible={controlsVisible}
              onSetControlsVisible={setControlsVisible}
            />
          )}
        </div>

        {/* ═══ PACK SELECTOR ═══ */}
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">AR Overlay Packs</h3>
            <Trophy className="h-4 w-4 text-yellow-400" />
          </div>

          {overlays.map((overlay) => {
            const IconComp = ICON_MAP[overlay.icon] || Flag;
            const isSelected = selected.some(s => s.id === overlay.id);
            const thumbSrc = SVG_MAP[overlay.id] || overlay.thumbnail;

            return (
              <motion.div key={overlay.id} variants={itemAnim}>
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
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                        <img src={thumbSrc} alt={overlay.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-md ${isSelected ? 'bg-yellow-400/20' : 'bg-white/10'}`}>
                            <IconComp className={`h-3.5 w-3.5 ${isSelected ? 'text-yellow-400' : 'text-gray-300'}`} />
                          </div>
                          <span className="text-white font-medium text-sm truncate">{overlay.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-yellow-400 flex-shrink-0" />}
                        </div>
                        <p className="text-gray-300 text-xs mt-0.5 truncate">{overlay.description}</p>
                      </div>
                    </div>

                    {/* Flag halo variant picker */}
                    {isSelected && overlay.id === 'flag-halos' && overlay.variants && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-2 pt-2 border-t border-white/10">
                        <div className="grid grid-cols-6 gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                          {overlay.variants.map((v) => {
                            const isActive = selected.find(s => s.id === 'flag-halos')?.chosenVariant?.code === v.code;
                            return (
                              <button
                                key={v.code}
                                onClick={(e) => { e.stopPropagation(); selectVariant('flag-halos', v); }}
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

                    {/* Commentary bubble style picker */}
                    {isSelected && overlay.id === 'commentary-bubble' && overlay.variants && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-2 pt-2 border-t border-white/10">
                        <div className="flex gap-2">
                          {overlay.variants.map(v => {
                            const isActive = selected.find(s => s.id === 'commentary-bubble')?.chosenVariant?.style === v.style;
                            return (
                              <button
                                key={v.style}
                                onClick={(e) => { e.stopPropagation(); selectVariant('commentary-bubble', v); }}
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

                    {/* Ref-card color toggle */}
                    {isSelected && overlay.id === 'ref-card' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-2 pt-2 border-t border-white/10">
                        <div className="flex gap-2">
                          {(['yellow', 'red'] as const).map(color => {
                            const isActive = (styles['ref-card']?.cardColor ?? 'yellow') === color;
                            return (
                              <button
                                key={color}
                                onClick={(e) => { e.stopPropagation(); handleStyleChange('ref-card', { cardColor: color }); }}
                                className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                                  isActive
                                    ? color === 'red'
                                      ? 'bg-red-500 text-white'
                                      : 'bg-yellow-400 text-black'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                              >
                                {color === 'yellow' ? '🟨 Yellow' : '🟥 Red'} Card
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
