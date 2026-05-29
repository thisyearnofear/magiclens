import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TransactionProgress, type TransactionStep } from '@/components/TransactionProgress';
import { ArrowLeft, Zap, Maximize2, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFullscreen } from '@/hooks/use-fullscreen';
import type { SelectedOverlay } from '@/hooks/usePack';
import type { OverlayStyle } from '@/components/remix/EditorOverlay';
import { captureRemixFrame, uploadThumbnailToGrove, setPendingThumbnail } from '@/lib/capture-thumbnail';

interface RemixPreviewProps {
  clipTitle: string;
  clipVideoUrl: string;
  selectedOverlays: SelectedOverlay[];
  overlayStyles?: Record<string, OverlayStyle>;
  overlaySourceSize?: { w: number; h: number } | null;
  onBack: () => void;
  onMint: () => void;
  isMinting?: boolean;
  mintButtonLabel?: string;
  mintLoadingText?: string;
  progressSteps?: TransactionStep[];
  progressTitle?: string;
  progressSubtitle?: string;
}

const OVERLAY_NAMES: Record<string, string> = {
  'flag-halos': 'Flag Halos',
  'goal-lower-third': 'GOAL! Lower-Third',
  'trophy-confetti': 'Trophy Confetti',
  'commentary-bubble': 'Commentary Bubble',
  'stadium-sparkles': 'Stadium Sparkles',
  'ref-card': 'Ref-Card Overlay',
};

export function RemixPreview({
  clipTitle,
  clipVideoUrl,
  selectedOverlays,
  overlayStyles = {},
  overlaySourceSize,
  onBack,
  onMint,
  isMinting,
  mintButtonLabel = 'Mint Remix on X Layer',
  mintLoadingText = 'Minting...',
  progressSteps,
  progressTitle,
  progressSubtitle,
}: RemixPreviewProps) {
  const packNames = selectedOverlays.map(o => OVERLAY_NAMES[o.id] || o.name);
  const { elementRef, isFullscreen, controlsVisible, setControlsVisible, toggle } = useFullscreen();
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewSizeRef = useRef<{ w: number; h: number } | null>(null);
  const [posScale, setPosScale] = useState(1);

  // Track preview dimensions and compute scale factors
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!isFullscreen && width > 0 && height > 0) {
        previewSizeRef.current = { w: width, h: height };
        // Scale overlay positions from source space to preview space
        if (overlaySourceSize && overlaySourceSize.w > 0) {
          setPosScale(width / overlaySourceSize.w);
        }
      } else if (isFullscreen && previewSizeRef.current) {
        setPosScale(width / (overlaySourceSize?.w ?? previewSizeRef.current.w));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [elementRef, isFullscreen, overlaySourceSize]);

  const handleMintClick = async () => {
    const blob = await captureRemixFrame(videoRef.current, selectedOverlays, clipTitle)
    const urlPromise = uploadThumbnailToGrove(blob).catch(() => null)
    setPendingThumbnail(urlPromise)
    onMint()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Preview Your Remix</h2>
        <p className="text-gray-300">Review before minting on X Layer</p>
      </div>

      {/* Video preview with overlays */}
      <div ref={elementRef} className="aspect-video bg-gray-900 rounded-xl border border-white/10 overflow-hidden relative mb-6 group">
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

        {/* Fullscreen floating toolbar — visible only when controls are shown */}
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
              <div>
                <span className="text-xs text-white/60 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                  {clipTitle}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen toggle button on video (always visible) */}
        <button
          onClick={toggle}
          className="absolute top-3 right-3 z-30 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors text-white/70 hover:text-white opacity-0 group-hover:opacity-100"
          title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen (F)'}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>

        {/* Scaled wrapper — keeps overlays aligned with video in fullscreen */}
        <div
          style={isFullscreen && posScale !== 1 ? {
            transform: `scale(${posScale})`,
            transformOrigin: '0 0',
            width: previewSizeRef.current?.w,
            height: previewSizeRef.current?.h,
            position: 'absolute',
            top: 0,
            left: 0,
          } : undefined}
        >
        {clipVideoUrl ? (
          <video
            ref={videoRef}
            src={clipVideoUrl}
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-green-900/20 to-green-900/40" />
        )}

        {/* Render selected overlays with user's styles */}
        {selectedOverlays.map(overlay => {
          const st = overlayStyles[overlay.id];
          const sx = st ? st.x * posScale : 0;
          const sy = st ? st.y * posScale : 0;
          const transform = st
            ? `translate(${sx}px, ${sy}px) rotate(${st.rotation}deg) scale(${st.scale})`
            : '';

          switch (overlay.id) {
            case 'flag-halos':
              return (
                <div key="flag-halos" className="absolute" style={{ transform, opacity: st?.opacity ?? 1, transformOrigin: '0 0' }}>
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-green-400/50"
                      style={{ animation: 'spin 8s linear infinite' }} />
                    <div className="absolute inset-1 rounded-full border-2 border-yellow-400/30"
                      style={{ animation: 'spin 12s linear infinite', animationDirection: 'reverse' }} />
                    {overlay.chosenVariant?.flagUrl ? (
                      <img
                        src={overlay.chosenVariant.flagUrl}
                        alt={overlay.chosenVariant.name}
                        className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] rounded-full object-cover border-2 border-white/20 shadow-lg"
                      />
                    ) : (
                      <div className="absolute inset-3 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">WC</div>
                    )}
                  </div>
                </div>
              );
            case 'goal-lower-third':
              return (
                <div key="goal-lower" className="absolute" style={{ transform, opacity: st?.opacity ?? 1, transformOrigin: '0 0' }}>
                  <div className="px-8 py-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl shadow-2xl shadow-yellow-500/30 border border-yellow-300/50">
                    <span className="text-white font-black text-4xl tracking-[0.15em] whitespace-nowrap">GOAL!</span>
                  </div>
                </div>
              );
            case 'trophy-confetti':
              return (
                <div key="confetti" className="absolute inset-0 overflow-hidden pointer-events-none">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        background: ['#FFD700', '#FF4500', '#FF69B4', '#00FF88', '#00BFFF'][i % 5],
                        animation: `fall ${2 + Math.random() * 2}s ${Math.random() * 2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              );
            case 'commentary-bubble':
              return (
                <div key="commentary" className="absolute" style={{ transform, opacity: st?.opacity ?? 1, transformOrigin: '0 0' }}>
                  <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-yellow-400/30 p-3 shadow-xl max-w-[200px]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs">🎙</span>
                      <span className="text-yellow-400 text-xs font-bold">LIVE</span>
                    </div>
                    <p className="text-white text-sm leading-tight">{st?.text || 'What a moment!'}</p>
                    <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-gray-900/80 border-r border-b border-yellow-400/30 rotate-45" />
                  </div>
                </div>
              );
            case 'stadium-sparkles':
              return (
                <div key="sparkles" className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                      style={{
                        left: `${8 + (i * 8)}%`,
                        top: `${10 + (i * 7)}%`,
                        animation: `pulse 1.5s ${Math.random() * 2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              );
            case 'ref-card':
              return (
                <div key="ref-card" className="absolute" style={{ transform, opacity: st?.opacity ?? 1, transformOrigin: '0 0' }}>
                  <div className={`backdrop-blur-md rounded-xl border p-3 shadow-xl ${
                    st?.cardColor === 'red' ? 'bg-red-900/70 border-red-400/40' : 'bg-gray-900/80 border-yellow-400/40'
                  }`}>
                    <div className={`w-8 h-6 rounded flex items-center justify-center ${
                      st?.cardColor === 'red' ? 'bg-red-500' : 'bg-yellow-400'
                    }`}>
                      <span className="text-black text-xs font-bold">{st?.cardColor === 'red' ? 'RED' : 'YLW'}</span>
                    </div>
                  </div>
                </div>
              );
            default:
              return null;
          }
        })}
        </div>{/* end scaled wrapper */}
      </div>

      {/* Metadata summary */}
      <Card className="bg-white/5 border-white/10 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">{clipTitle}</h3>
              <p className="text-gray-300 text-sm mt-1">
                {packNames.length > 0
                  ? `Using ${packNames.length} overlay pack${packNames.length > 1 ? 's' : ''}: ${packNames.join(', ')}`
                  : 'No overlays selected'}
              </p>
            </div>
            <Badge className="bg-purple-500">X Layer</Badge>
          </div>
        </CardContent>
      </Card>

      {progressSteps && (
        <TransactionProgress
          title={progressTitle || 'Minting remix'}
          subtitle={progressSubtitle || 'Keep this tab open while MagicLens prepares metadata and submits the X Layer transaction.'}
          steps={progressSteps}
          className="mb-6"
        />
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="text-white">
          <ArrowLeft className="h-4 w-4 mr-2" /> Adjust Overlays
        </Button>
        <Button
          onClick={handleMintClick}
          size="lg"
          loading={isMinting}
          loadingText={mintLoadingText}
          className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold disabled:opacity-50"
        >
          <Zap className="h-5 w-5 mr-2" /> {mintButtonLabel}
        </Button>
      </div>
    </div>
  );
}
