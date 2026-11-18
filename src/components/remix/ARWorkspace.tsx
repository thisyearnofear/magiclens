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
import { StaticOverlayArt } from './StaticOverlayArt';
import { LockOnReticle } from './LockOnReticle';
import { TrackedOverlayLayer, ANCHOR_OPTIONS, type AnchorId } from './TrackedOverlayLayer';
import { coverFit } from '@/lib/pose-frames';
import { usePack, OverlayDefinition, SelectedOverlay } from '@/hooks/usePack';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { useClipPoseTracker } from '@/hooks/useClipPoseTracker';
import { exportRemixVideo } from '@/lib/remix-exporter';
import { useReferrer } from '@/hooks/useReferrer';
import { useIsPro } from '@/hooks/useIsPro';
import { toast } from 'sonner';

const DEFAULT_STYLES: Record<string, OverlayStyle> = {
  'flag-halos': { x: 240, y: 120, scale: 1, rotation: 0, opacity: 1 },
  'goal-lower-third': { x: 160, y: 380, scale: 1, rotation: 0, opacity: 1 },
  'commentary-bubble': { x: 12, y: 12, scale: 1, rotation: -3, opacity: 1, text: 'What a moment!' },
  'ref-card': { x: 510, y: 70, scale: 1, rotation: 2, opacity: 1, cardColor: 'yellow' },
  'ghost-trail': { x: 320, y: 240, scale: 1, rotation: 0, opacity: 1 },
  'player-card': { x: 500, y: 60, scale: 1, rotation: -2, opacity: 1, text: 'STAR PLAYER' },
};

// Approximate DOM footprint (px) — used to clamp the seeded spawn
// position so a default can't land outside the visible container.
const SPAWN_SIZE: Record<string, { w: number; h: number }> = {
  'flag-halos': { w: 80, h: 80 },
  'goal-lower-third': { w: 240, h: 78 },
  'commentary-bubble': { w: 190, h: 80 },
  'ref-card': { w: 76, h: 65 },
  'player-card': { w: 160, h: 74 },
};

function seedStyle(id: string, container: HTMLElement | null): OverlayStyle {
  const base = DEFAULT_STYLES[id] ?? { x: 200, y: 180, scale: 1, rotation: 0, opacity: 1 };
  if (!container) return base;
  const fp = SPAWN_SIZE[id] ?? { w: 160, h: 80 };
  return {
    ...base,
    x: Math.min(Math.max(base.x, 4), Math.max(4, container.clientWidth - fp.w - 8)),
    y: Math.min(Math.max(base.y, 4), Math.max(4, container.clientHeight - fp.h - 8)),
  };
}

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
  // Default to Track mode — pose analysis starts on mount and overlays lock on
  // as the user picks them. Editor stays one tab away for manual placement.
  const [mode, setMode] = useState<'preview' | 'live' | 'track'>('track');
  // Pro perks: watermark-free exports + 60s cap (free tier: 30s).
  const { isPro, priceEth, buyPass, isPending: proPending, isConfirming: proConfirming, isConfirmed: proConfirmed, refetchPro, connected } = useIsPro();
  const exportCap = isPro ? 60 : 30;
  const tracker = useClipPoseTracker(clipVideoUrl || null, exportCap);
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
        maxDuration: exportCap,
        // Pro pass holders + seeded creators (arrived via ?ref=) get clean
        // exports — see docs/MONETIZATION.md
        watermark: !(isPro || referrerAddress),
        // Editor placements are fixed — without this the exported file
        // drops every manually-placed overlay (pose anchors only).
        ...(mode !== 'track' && elementRef.current
          ? { staticPlacements: { styles, srcW: elementRef.current.clientWidth, srcH: elementRef.current.clientHeight } }
          : {}),
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
  }, [exportState, selected, anchorOverrides, styles, poseAt, trackVideoRef, referrerAddress, isPro, exportCap]);

  // Creator Pass confirmed on-chain → refresh entitlement and celebrate
  React.useEffect(() => {
    if (proConfirmed) {
      refetchPro();
      toast.success('Creator Pass active', {
        description: 'Watermark-free exports + 60s clips unlocked.',
      });
    }
  }, [proConfirmed, refetchPro]);

  const handleBuyPro = useCallback(() => {
    if (!connected) {
      toast.info('Connect a wallet to buy the Creator Pass');
      return;
    }
    buyPass()?.catch((e) => {
      toast.error('Purchase failed', { description: e instanceof Error ? e.message.split('\n')[0] : 'Try again' });
    });
  }, [connected, buyPass]);

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

  // Lock-on reveal: when tracking resolves with a subject, play the
  // reticle converge once over the subject's bounding box.
  const [lockBox, setLockBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const prevTrackStatus = React.useRef(trackStatus);
  React.useEffect(() => {
    const wasReady = prevTrackStatus.current === 'ready';
    prevTrackStatus.current = trackStatus;
    if (wasReady || trackStatus !== 'ready') return;
    const container = elementRef.current;
    const video = trackVideoRef.current;
    const lms = tracks.length > 0 ? poseAt(video?.currentTime ?? 0) : null;
    if (!container || !video || !lms || lms.length === 0) return;
    const { w, h, x, y } = coverFit(video.videoWidth, video.videoHeight, container.clientWidth, container.clientHeight);
    const xs = lms.map(l => l.x), ys = lms.map(l => l.y);
    setLockBox({
      x: x + Math.min(...xs) * w,
      y: y + Math.min(...ys) * h,
      w: (Math.max(...xs) - Math.min(...xs)) * w,
      h: (Math.max(...ys) - Math.min(...ys)) * h,
    });
    const t = setTimeout(() => setLockBox(null), 1400);
    return () => clearTimeout(t);
  }, [trackStatus, tracks.length, poseAt]);

  // No subject found — auto-route to manual placement once, with a reason.
  const autoSwitched = React.useRef(false);
  React.useEffect(() => {
    if (trackStatus === 'ready' && tracks.length === 0 && selected.length > 0 && !autoSwitched.current) {
      autoSwitched.current = true;
      setMode('preview');
      toast('No player detected — place your overlays manually', { icon: '👆' });
    }
  }, [trackStatus, tracks.length, selected.length]);

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
        const seeded = seedStyle(overlay.id, elementRef.current);
        setStyles(s => ({ ...s, [overlay.id]: seeded }));
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
          {/* Undo/Redo — hidden until there's history to navigate */}
          <div className={`flex gap-1 ml-4 transition-opacity ${canUndo || canRedo ? '' : 'opacity-0 pointer-events-none'}`}>
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
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={selected.length > 0
              ? { boxShadow: ['0 0 0px rgba(250,204,21,0)', '0 0 18px rgba(250,204,21,0.45)', '0 0 0px rgba(250,204,21,0)'] }
              : { boxShadow: '0 0 0px rgba(250,204,21,0)' }}
            transition={selected.length > 0 ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
            className="rounded-md"
          >
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
                title="Drag overlays anywhere on the frame"
              >
                <span>🎬</span> Place manually
              </button>
              <button
                onClick={() => setMode('track')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 relative ${
                  mode === 'track' ? 'bg-purple-500/20 text-purple-300 shadow-sm ring-1 ring-purple-500/30' : 'text-gray-300 hover:text-gray-300'
                }`}
                title="Overlays follow the player through the clip"
              >
                <Crosshair className={`h-3 w-3 ${mode === 'track' ? 'text-purple-400' : 'text-gray-600'}`} />
                Follow player
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

            {/* Webcam mode — secondary affordance, not equal tab billing */}
            <button
              onClick={() => setMode(mode === 'live' ? 'preview' : 'live')}
              className={`text-[11px] transition-colors ${
                mode === 'live' ? 'text-green-300' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {mode === 'live' ? '← Exit webcam' : 'Try on webcam →'}
            </button>

            <p className="text-[11px] text-gray-500 hidden md:block">
              {mode === 'track'
                ? 'Overlays follow the detected player'
                : mode === 'live'
                ? 'Trying overlays on your webcam'
                : 'Drag overlays anywhere on the frame'}
            </p>

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
                    tracks.length > 0 ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                        <span className="text-sm font-medium text-purple-300">Pose tracking active — overlays follow the player</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-medium text-amber-300">No player detected</span>
                        <button
                          onClick={() => setMode('preview')}
                          className="text-xs font-semibold text-amber-200 bg-amber-400/15 border border-amber-400/30 rounded-md px-2 py-1 hover:bg-amber-400/25 transition-colors"
                        >
                          Place overlays manually →
                        </button>
                      </>
                    )
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
                      {isPro ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-yellow-400/15 border border-yellow-400/30 px-2 py-1 text-[10px] font-bold text-yellow-300">
                          ⚡ PRO
                        </span>
                      ) : selected.length > 0 ? (
                        <button
                          onClick={handleBuyPro}
                          disabled={proPending || proConfirming}
                          className="text-[11px] text-amber-300/80 hover:text-amber-200 transition-colors underline underline-offset-2 decoration-amber-400/30 disabled:opacity-50"
                          title="Creator Pass: watermark-free exports + 60s clips"
                        >
                          {proPending || proConfirming ? 'Buying…' : `Go Pro${priceEth ? ` · ${priceEth} OKB` : ''}`}
                        </button>
                      ) : null}
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

              <div ref={elementRef} className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-purple-500/20">
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
                {trackStatus === 'ready' && selected.length === 0 && tracks.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                    <p className="text-gray-300 text-sm">
                      {tracks.length > 1
                        ? `${tracks.length} players found — select an overlay, it locks onto one`
                        : 'Select an overlay — it will follow the player'}
                    </p>
                  </div>
                )}
                {trackStatus === 'ready' && tracks.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                    <p className="text-gray-300 text-sm">No player detected — place overlays in Place manually</p>
                  </div>
                )}

                {/* Ghost overlays — visible the moment they're picked,
                    while the tracker is still scanning */}
                {(trackStatus === 'loading' || trackStatus === 'tracking') && selected.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none z-10">
                    {selected.map(ov => {
                      const st = styles[ov.id];
                      if (!st) return null;
                      return (
                        <motion.div
                          key={ov.id}
                          className="absolute left-0 top-0"
                          style={{ transformOrigin: '0 0' }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: [0.35, 0.55, 0.35], scale: 1 }}
                          transition={{ opacity: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 0.4, ease: 'backOut' } }}
                        >
                          <div style={{ transform: `translate(${st.x}px, ${st.y}px) rotate(${st.rotation}deg) scale(${st.scale})`, transformOrigin: '0 0' }}>
                            <StaticOverlayArt overlay={ov} style={{ x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 }} posScale={0} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Scan indicator — slim chip, video stays visible */}
                {(trackStatus === 'loading' || trackStatus === 'tracking') && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-black/70 backdrop-blur px-4 py-2 pointer-events-none">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                      <Crosshair className="h-4 w-4 text-purple-400" />
                    </motion.div>
                    <p className="text-white text-xs font-medium">
                      {trackStatus === 'loading'
                        ? 'Loading Pose AI (one-time)…'
                        : `Scanning frames… ${Math.round(trackProgress * 100)}% — overlays will lock on`}
                    </p>
                  </div>
                )}

                {/* Lock-on reveal */}
                {lockBox && <LockOnReticle box={lockBox} />}
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
