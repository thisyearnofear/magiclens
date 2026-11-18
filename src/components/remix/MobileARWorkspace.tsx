import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { usePack, OverlayDefinition, SelectedOverlay } from '@/hooks/usePack';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { useClipPoseTracker } from '@/hooks/useClipPoseTracker';
import { TrackedOverlayLayer, type AnchorId } from './TrackedOverlayLayer';
import { EditorOverlay } from './EditorOverlay';
import { StaticOverlayArt } from './StaticOverlayArt';
import { ExportSuccess } from './ExportSuccess';
import { playTick, playUntick, playSuccess } from '@/lib/ui-sound';
import { exportRemixVideo } from '@/lib/remix-exporter';
import { useReferrer } from '@/hooks/useReferrer';
import { useIsPro } from '@/hooks/useIsPro';
import { toast } from 'sonner';
import type { OverlayStyle } from './EditorOverlay';
import {
  Flag, Sparkles, Image, MessageCircle, AlertTriangle,
  Check, Eye, Trophy, Maximize2, Minimize, Loader2, Download, Crosshair
} from 'lucide-react';

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

interface MobileARWorkspaceProps {
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

export default function MobileARWorkspace({ clipTitle, clipVideoUrl, onNext, onBack }: MobileARWorkspaceProps) {
  const { manifest, loading } = usePack();
  const [selected, setSelected] = useState<SelectedOverlay[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [styles, setStyles] = useState<Record<string, OverlayStyle>>({});
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [refCardColor, setRefCardColor] = useState<'yellow' | 'red'>('yellow');
  const [exportState, setExportState] = useState<'idle' | 'recording' | 'done'>('idle');
  const [exported, setExported] = useState<{ url: string; extension: string; duration: number } | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const trackVideoRef = useRef<HTMLVideoElement | null>(null);
  const { elementRef, isFullscreen, controlsVisible, setControlsVisible, toggle } = useFullscreen();
  const { referrerAddress } = useReferrer();
  const { isPro, priceEth, buyPass, isPending: proPending, isConfirming: proConfirming, isConfirmed: proConfirmed, refetchPro, connected } = useIsPro();
  const exportCap = isPro ? 60 : 30;

  const {
    status: trackStatus,
    progress: trackProgress,
    tracks,
    selectedTrackId,
    setSelectedTrackId,
    poseAt,
    subjectsAt,
    track: startTracking,
  } = useClipPoseTracker(clipVideoUrl || null, exportCap);

  // Mobile is magic-first: analysis starts the moment the workspace mounts,
  // so overlays lock on as the user picks them.
  useEffect(() => {
    if (trackStatus === 'idle') startTracking();
  }, [trackStatus, startTracking]);

  useEffect(() => {
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

  const toggleOverlay = (overlay: OverlayDefinition) => {
    if (selected.some(s => s.id === overlay.id)) playUntick(); else playTick();
    setSelected(prev => {
      const exists = prev.find(s => s.id === overlay.id);
      if (exists) return prev.filter(s => s.id !== overlay.id);
      if (!styles[overlay.id]) {
        setStyles(s => ({ ...s, [overlay.id]: seedStyle(overlay.id, elementRef.current) }));
      }
      const chosenVariant = overlay.variants && overlay.variants.length > 0 ? overlay.variants[0] : null;
      return [...prev, { ...overlay, chosenVariant }];
    });
  };

  const selectVariant = (overlayId: string, variant: any) => {
    setSelected(prev => prev.map(s => s.id === overlayId ? { ...s, chosenVariant: variant } : s));
  };

  const handleExport = useCallback(async () => {
    const video = trackVideoRef.current;
    if (!video || exportState === 'recording') return;
    setExportState('recording');
    setExportProgress(0);
    try {
      const result = await exportRemixVideo({
        video,
        overlays: selected,
        texts: Object.fromEntries(selected.map((o) => [o.id, styles[o.id]?.text ?? '']).filter(([, v]) => v)),
        opacities: Object.fromEntries(selected.map((o) => [o.id, styles[o.id]?.opacity ?? 1])),
        poseAt,
        onProgress: setExportProgress,
        maxDuration: exportCap,
        watermark: !(isPro || referrerAddress),
        ...(manualMode && elementRef.current
          ? { staticPlacements: { styles, srcW: elementRef.current.clientWidth, srcH: elementRef.current.clientHeight } }
          : {}),
      });
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `magiclens-remix.${result.extension}`;
      a.click();
      setExportState('done');
      setExported({ url, extension: result.extension, duration: result.duration });
      playSuccess();
    } catch (err) {
      setExportState('idle');
      toast.error('Export failed', { description: err instanceof Error ? err.message : 'Try again' });
    }
  }, [exportState, selected, styles, poseAt, referrerAddress, isPro, exportCap]);

  const sourceSize = () =>
    elementRef.current ? { w: elementRef.current.clientWidth, h: elementRef.current.clientHeight } : undefined;

  const handleNext = () =>
    onNext(selected, styles, sourceSize(), {
      mode: trackStatus === 'ready' && !manualMode ? 'track' : 'static',
      anchors: {},
      subjectId: selectedTrackId,
    });

  const overlays = manifest?.overlays ?? [];
  const selectedIds = new Set(selected.map(s => s.id));
  const analyzing = trackStatus === 'loading' || trackStatus === 'tracking';

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
        <button onClick={onBack} className="text-gray-300 text-sm">Back</button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-white">AR Overlays</h2>
          <p className="text-gray-300 text-[10px]">{clipTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-gray-300 active:bg-white/20"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <Button
            onClick={handleNext}
            disabled={selected.length === 0}
            size="sm"
            className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold text-xs h-8"
          >
            <Eye className="h-3 w-3 mr-1" /> Preview
          </Button>
        </div>
      </div>

      {/* Track status bar */}
      <div className="px-3 pb-1.5 shrink-0 flex items-center justify-between gap-2">
        {manualMode ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-yellow-300 min-w-0">
            <span className="truncate">Manual placement — drag overlays onto the clip</span>
          </span>
        ) : trackStatus === 'ready' ? (
          tracks.length > 0 ? (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-purple-300 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shrink-0" />
              <span className="truncate">
                {tracks.length > 1 ? `${tracks.length} players — tap a dot to switch` : 'Player tracked — overlays follow them'}
              </span>
            </span>
          ) : (
            <button
              onClick={() => setManualMode(true)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-amber-300 min-w-0 text-left"
            >
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span className="truncate">No player detected — <span className="underline">place overlays manually</span></span>
            </button>
          )
        ) : analyzing ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-purple-300">
            <Loader2 className="h-3 w-3 animate-spin" />
            {trackStatus === 'loading' ? 'Loading pose AI…' : `Tracking player… ${Math.round(trackProgress * 100)}%`}
          </span>
        ) : trackStatus === 'error' ? (
          <button onClick={startTracking} className="flex items-center gap-1.5 text-[11px] font-medium text-red-300">
            <AlertTriangle className="h-3 w-3" /> Tracking failed — tap to retry
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Crosshair className="h-3 w-3" /> Preparing player tracking…
          </span>
        )}
        {trackStatus === 'ready' && !manualMode && tracks.length > 0 && (
          <button
            onClick={() => setManualMode(true)}
            className="text-[10px] text-gray-400 hover:text-gray-200 underline underline-offset-2 shrink-0"
          >
            Manual
          </button>
        )}
        {manualMode && trackStatus === 'ready' && tracks.length > 0 && (
          <button
            onClick={() => setManualMode(false)}
            className="text-[10px] text-purple-300 hover:text-purple-200 underline underline-offset-2 shrink-0"
          >
            Auto-track
          </button>
        )}
        {trackStatus === 'ready' && !isPro && (
          <button
            onClick={handleBuyPro}
            disabled={proPending || proConfirming}
            className="text-[10px] text-amber-300/80 hover:text-amber-200 underline underline-offset-2 decoration-amber-400/30 shrink-0 disabled:opacity-50"
          >
            {proPending || proConfirming ? 'Buying…' : `Pro${priceEth ? ` ${priceEth} OKB` : ''}`}
          </button>
        )}
        {trackStatus === 'ready' && isPro && (
          <span className="text-[9px] font-bold text-yellow-300 bg-yellow-400/15 border border-yellow-400/30 rounded px-1.5 py-0.5 shrink-0">⚡ PRO</span>
        )}
        {selected.length > 0 && (
          <button
            onClick={handleExport}
            disabled={exportState === 'recording'}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-yellow-400 text-black text-[10px] font-bold shrink-0 disabled:opacity-60 active:scale-95 transition-transform"
          >
            {exportState === 'recording' ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> {Math.round(exportProgress * 100)}%</>
            ) : (
              <><Download className="h-3 w-3" /> {exportState === 'done' ? 'Saved!' : 'Export'}</>
            )}
          </button>
        )}
      </div>

      {/* Analysis progress bar */}
      {trackStatus === 'tracking' && (
        <div className="mx-3 mb-1.5 h-0.5 bg-white/10 rounded-full overflow-hidden shrink-0">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400"
            animate={{ width: `${trackProgress * 100}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </div>
      )}

      {/* Video preview */}
      <div className="px-3 pb-2 shrink-0">
        <div ref={elementRef} className="aspect-video bg-gray-900 rounded-xl border border-white/10 overflow-hidden relative">
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
            {isFullscreen && controlsVisible && (
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

          {/* Fullscreen floating toolbar — visible only when controls are shown */}
          <AnimatePresence>
            {isFullscreen && controlsVisible && (
              <motion.div
                key="fullscreen-toolbar"
                initial={{ y: -24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -24, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute top-0 left-0 right-0 z-50 flex items-center gap-2 px-3 py-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent"
              >
                <div>
                  <button
                    onClick={toggle}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-medium backdrop-blur-sm active:bg-white/30"
                  >
                    <Minimize className="h-3.5 w-3.5" />
                    Exit
                  </button>
                </div>
                <div className="flex-1" />
                <div>
                  <span className="text-xs text-white/60 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                    {selected.length} overlay{selected.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div>
                  <button
                    onClick={handleNext}
                    disabled={selected.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 text-black hover:bg-yellow-500 font-semibold text-xs transition-colors disabled:opacity-50 active:scale-95"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fullscreen toggle button on video (always visible, shown as a subtle overlay) */}
          <button
            onClick={(e) => { e.stopPropagation(); toggle(); }}
            className="absolute bottom-2 right-2 z-30 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm transition-colors text-white/70 active:bg-black/80"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {clipVideoUrl ? (
            <video
              ref={trackVideoRef}
              src={clipVideoUrl}
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full object-cover"
              muted loop playsInline autoPlay
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-green-900/20 to-green-900/40 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-gray-600" />
            </div>
          )}

          {/* Manual placement layer — drag/resize/rotate via EditorOverlay */}
          {manualMode && (
            <>
              <div className="absolute inset-0 z-0" onClick={() => setSelectedOverlayId(null)} />
              {selected.map((ov) => {
                const st = styles[ov.id] ?? DEFAULT_STYLES[ov.id] ?? { x: 100, y: 100, scale: 1, rotation: 0, opacity: 1 };
                return (
                  <EditorOverlay
                    key={ov.id}
                    overlayId={ov.id}
                    style={st}
                    onStyleChange={(id, partial) => setStyles((s) => ({ ...s, [id]: { ...st, ...partial } }))}
                    isSelected={selectedOverlayId === ov.id}
                    onSelect={setSelectedOverlayId}
                    onRemove={(id) => setSelected((prev) => prev.filter((s) => s.id !== id))}
                  >
                    {/* Neutralized style — EditorOverlay owns the transforms,
                        StaticOverlayArt only provides the artwork */}
                    <StaticOverlayArt overlay={ov} style={{ x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 }} posScale={0} />
                  </EditorOverlay>
                );
              })}
            </>
          )}

          {/* Pose-tracked overlay layer — same renderer as desktop */}
          {!manualMode && trackStatus === 'ready' && selected.length > 0 && (
            <TrackedOverlayLayer
              videoRef={trackVideoRef}
              poseAt={poseAt}
              subjectsAt={subjectsAt}
              selectedSubjectId={selectedTrackId}
              onSelectSubject={setSelectedTrackId}
              overlays={selected}
              opacities={Object.fromEntries(selected.map(o => [o.id, styles[o.id]?.opacity ?? 1]))}
              texts={Object.fromEntries(selected.map(o => [o.id, styles[o.id]?.text ?? '']).filter(([, v]) => v))}
            />
          )}

          {/* Prompt to pick overlays once tracking is live (or in manual mode) */}
          {selected.length === 0 && (manualMode || (trackStatus === 'ready' && tracks.length > 0)) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
              <p className="text-gray-200 text-xs text-center px-6">
                {manualMode ? 'Pick an overlay below — then drag it into place' : 'Pick an overlay below — it locks onto the player'}
              </p>
            </div>
          )}

          {/* Show selected overlay count (animated hide during fullscreen) */}
          <AnimatePresence>
            {selected.length > 0 && !isFullscreen && (
              <motion.div
                key="overlay-count"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                {selected.length}
              </motion.div>
            )}
          </AnimatePresence>
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
          <div className="flex items-center justify-between mb-2 sticky top-0 bg-gradient-to-b from-purple-900 via-blue-900/95 to-transparent backdrop-blur-md pt-1 pb-2 z-10">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">AR Overlay Packs</h3>
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
                          <IconComp className={`h-3 w-3 ${isSelected ? 'text-yellow-400' : 'text-gray-300'}`} />
                        </div>
                        <span className="text-white font-medium text-sm">{overlay.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-yellow-400 flex-shrink-0 ml-auto" />}
                      </div>
                      <p className="text-gray-300 text-[11px] mt-0.5">{overlay.description}</p>
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

      {/* Export payoff — replays the real exported video */}
      <AnimatePresence>
        {exported && (
          <ExportSuccess
            videoUrl={exported.url}
            extension={exported.extension}
            duration={exported.duration}
            clipTitle={clipTitle}
            watermarked={!(isPro || referrerAddress)}
            onDownloadAgain={() => {
              const a = document.createElement('a');
              a.href = exported.url;
              a.download = `magiclens-remix.${exported.extension}`;
              a.click();
            }}
            onMint={() => {
              const url = exported.url;
              setExported(null);
              setExportState('idle');
              URL.revokeObjectURL(url);
              handleNext();
            }}
            onClose={() => {
              URL.revokeObjectURL(exported.url);
              setExported(null);
              setExportState('idle');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
