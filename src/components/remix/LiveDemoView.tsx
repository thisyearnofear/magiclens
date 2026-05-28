import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoseLandmarker } from '@/hooks/usePoseLandmarker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Camera, CameraOff, Loader2, RefreshCw, AlertTriangle,
  Target, Move, Sparkles, Maximize2, Minimize
} from 'lucide-react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

interface LiveDemoViewProps {
  selectedOverlayIds: string[];
  onPoseUpdate?: (positions: { head: { x: number; y: number } | null; leftShoulder: { x: number; y: number } | null; rightShoulder: { x: number; y: number } | null; leftWrist: { x: number; y: number } | null; rightWrist: { x: number; y: number } | null }) => void;
  fullscreenRef?: React.RefObject<HTMLDivElement | null>;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  controlsVisible?: boolean;
  onSetControlsVisible?: (visible: boolean) => void;
}

// MediaPipe pose landmark indices we track
const LANDMARK = {
  NOSE: 0, LEFT_EYE: 2, RIGHT_EYE: 5,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
};

/** Get overlay position from a specific landmark */
function landmarkPosition(
  landmarks: NormalizedLandmark[], index: number, cw: number, ch: number,
): { x: number; y: number } | null {
  const lm = landmarks[index];
  if (!lm || (lm.visibility ?? 0) < 0.3) return null;
  return { x: lm.x * cw, y: lm.y * ch };
}

/** Tracking info: which overlay tracks which body part */
const TRACKING_INFO = [
  { label: 'Flag Halo', icon: '🏆', part: 'Head (Nose)', landmark: 'NOSE', color: 'from-green-500 to-yellow-500' },
  { label: 'Commentary', icon: '🎙', part: 'Shoulder', landmark: 'LEFT_SHOULDER', color: 'from-blue-500 to-cyan-500' },
  { label: 'Celebration FX', icon: '✨', part: 'Wrists', landmark: 'WRISTS', color: 'from-yellow-400 to-pink-500' },
];

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'loading-model': { label: 'Loading AI model...', color: 'text-yellow-400', icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  'loading-camera': { label: 'Starting camera...', color: 'text-yellow-400', icon: <Camera className="h-4 w-4 animate-pulse" /> },
  ready: { label: 'Pose tracking active', color: 'text-green-400', icon: <Camera className="h-4 w-4" /> },
  error: { label: 'Error', color: 'text-red-400', icon: <AlertTriangle className="h-4 w-4" /> },
  unavailable: { label: 'Tap Start to activate', color: 'text-gray-400', icon: <CameraOff className="h-4 w-4" /> },
};

export function LiveDemoView({ selectedOverlayIds, onPoseUpdate, fullscreenRef, isFullscreen, onToggleFullscreen, controlsVisible, onSetControlsVisible }: LiveDemoViewProps) {
  const { videoRef, canvasRef, status, error, currentPose, isActive, start, stop } = usePoseLandmarker();

  // Auto-start when component mounts
  useEffect(() => {
    const timer = setTimeout(() => { if (!isActive && status === 'unavailable') start(); }, 500);
    return () => { clearTimeout(timer); stop(); };
  }, []);

  const cfg = STATUS_CFG[status];
  const visible = currentPose?.landmarks.filter(l => (l.visibility ?? 0) > 0.5).length ?? 0;

  const overlayPositions = useMemo(() => {
    if (!currentPose?.landmarks) return null;
    const l = currentPose.landmarks;
    return {
      head: landmarkPosition(l, LANDMARK.NOSE, 640, 480),
      leftShoulder: landmarkPosition(l, LANDMARK.LEFT_SHOULDER, 640, 480),
      rightShoulder: landmarkPosition(l, LANDMARK.RIGHT_SHOULDER, 640, 480),
      leftWrist: landmarkPosition(l, LANDMARK.LEFT_WRIST, 640, 480),
      rightWrist: landmarkPosition(l, LANDMARK.RIGHT_WRIST, 640, 480),
    };
  }, [currentPose]);

  // Bridge pose data back to editor
  useEffect(() => {
    if (onPoseUpdate && overlayPositions) {
      onPoseUpdate(overlayPositions);
    }
  }, [overlayPositions, onPoseUpdate]);

  // Determine which AR overlays to render based on pose data (used for bridge to editor)
  // Note: overlay rendering below uses selectedOverlayIds directly with pose positions

  return (
    <div className="space-y-3">
      {/* Status + controls bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            key={status}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cfg.color}
          >
            {cfg.icon}
          </motion.span>
          <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
          {status === 'ready' && (
            <Badge className="bg-green-500/20 text-green-300 text-xs border border-green-500/30">{visible} tracked</Badge>
          )}
        </div>
        <div className="flex gap-2">
          {status === 'ready' ? (
            <Button onClick={stop} size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <CameraOff className="h-3.5 w-3.5 mr-1" /> Stop
            </Button>
          ) : status === 'error' ? (
            <Button onClick={start} size="sm" className="bg-yellow-400 text-black hover:bg-yellow-500">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
            </Button>
          ) : (
            <Button onClick={start} size="sm" disabled={status !== 'unavailable'} className="bg-green-500 text-white hover:bg-green-600">
              <Camera className="h-3.5 w-3.5 mr-1" /> Start Camera
            </Button>
          )}
        </div>
      </div>

      {/* Error card */}
      {status === 'error' && error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-red-300 text-sm font-medium">{error}</p>
              <p className="text-red-400/60 text-xs mt-0.5">Try Chrome on desktop with a webcam connected.</p>
            </div>
            <Button onClick={start} size="sm" variant="outline" className="border-red-400/30 text-red-300 hover:bg-red-500/10 flex-shrink-0">
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Video + Canvas + AR overlay container */}
      <div ref={fullscreenRef} className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-white/10">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full scale-x-[-1]" />

        {/* Pose-tracked AR overlays */}
        {status === 'ready' && overlayPositions && (
          <>
            {/* Flag halo at head — only if flag-halos is selected */}
            {selectedOverlayIds.includes('flag-halos') && overlayPositions.head && (
              <motion.div
                className="absolute pointer-events-none z-10"
                style={{ left: `${overlayPositions.head.x - 28}px`, top: `${overlayPositions.head.y - 75}px` }}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 border-[3px] border-white shadow-2xl shadow-yellow-400/30 flex items-center justify-center text-xl">
                    🏆
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-[9px] text-green-300 rounded font-mono">HEAD</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* GOAL! banner at center — only if goal-lower-third is selected */}
            {selectedOverlayIds.includes('goal-lower-third') && overlayPositions.head && (
              <motion.div
                className="absolute pointer-events-none z-10 left-1/2 -translate-x-1/2"
                style={{ top: `${overlayPositions.head.y - 40}px` }}
                initial={{ scale: 0, y: 50 }} animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <div className="px-6 py-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-lg shadow-2xl shadow-yellow-500/30">
                  <span className="text-white font-black text-xl tracking-[0.15em]">GOAL!</span>
                </div>
              </motion.div>
            )}

            {/* Commentary bubble at shoulder */}
            {selectedOverlayIds.includes('commentary-bubble') && overlayPositions.leftShoulder && (
              <motion.div
                className="absolute pointer-events-none z-10"
                style={{ left: `${overlayPositions.leftShoulder.x + 15}px`, top: `${overlayPositions.leftShoulder.y - 55}px` }}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.08 }}
              >
                <div className="bg-gray-900/85 backdrop-blur-md rounded-xl border border-blue-400/40 px-3 py-2 shadow-xl shadow-blue-500/10">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center text-[6px] text-white font-bold">LIVE</span>
                    <span className="text-blue-400 text-[9px] font-bold">COMMENTARY</span>
                  </div>
                  <p className="text-white text-[11px] whitespace-nowrap">What a moment!</p>
                </div>
              </motion.div>
            )}

            {/* Ref card at shoulder */}
            {selectedOverlayIds.includes('ref-card') && overlayPositions.rightShoulder && (
              <motion.div
                className="absolute pointer-events-none z-10"
                style={{ left: `${overlayPositions.rightShoulder.x - 55}px`, top: `${overlayPositions.rightShoulder.y - 20}px` }}
                initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                <div className="bg-gray-900/85 backdrop-blur-md rounded-lg border border-yellow-400/40 px-2 py-1.5 shadow-xl">
                  <div className="w-6 h-4 bg-yellow-400 rounded-sm mx-auto" />
                  <span className="text-[8px] text-white font-bold block text-center mt-0.5">REF</span>
                </div>
              </motion.div>
            )}

            {/* Wrist particles for celebration effects */}
            {(selectedOverlayIds.includes('trophy-confetti') || selectedOverlayIds.includes('stadium-sparkles')) && overlayPositions.leftWrist && overlayPositions.rightWrist && (
              <>
                <motion.div className="absolute w-2 h-2 rounded-full pointer-events-none z-10 bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-yellow-400/50"
                  style={{ left: `${overlayPositions.leftWrist.x}px`, top: `${overlayPositions.leftWrist.y}px` }}
                  animate={{ scale: [1, 2.5, 1], opacity: [0.9, 0.2, 0.9] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <motion.div className="absolute w-2 h-2 rounded-full pointer-events-none z-10 bg-gradient-to-r from-blue-400 to-purple-500 shadow-lg shadow-blue-400/50"
                  style={{ left: `${overlayPositions.rightWrist.x}px`, top: `${overlayPositions.rightWrist.y}px` }}
                  animate={{ scale: [1, 2.5, 1], opacity: [0.9, 0.2, 0.9] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                />
              </>
            )}
          </>
        )}

        {/* Tap target — hold to reveal, release to hide */}
        {isFullscreen && (
          <div
            onPointerDown={() => onSetControlsVisible?.(true)}
            onPointerUp={() => onSetControlsVisible?.(false)}
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
                  onClick={onToggleFullscreen}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-medium backdrop-blur-sm"
                >
                  <Minimize className="h-3.5 w-3.5" />
                  Exit <span className="text-white/40 ml-1">Esc</span>
                </button>
              </div>
              <div className="flex-1" />
              <div>
                <span className="text-xs text-white/60 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                  {selectedOverlayIds.length} overlay{selectedOverlayIds.length !== 1 ? 's' : ''} · Pose Tracking
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pose guide — shown when tracking is active */}
        <AnimatePresence>
          {status === 'ready' && !isFullscreen && (
            <motion.div
              key="pose-guide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="absolute bottom-3 left-3 right-3 flex gap-2 justify-center pointer-events-none"
            >
              {TRACKING_INFO.map(t => (
                <div key={t.label} className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg border border-white/10 flex items-center gap-1.5">
                  <span className="text-xs">{t.icon}</span>
                  <span className="text-[10px] text-gray-300 font-medium">{t.part}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle state */}
        {status === 'unavailable' && !isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                <CameraOff className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-gray-300 text-sm font-medium">Camera Off</p>
              <p className="text-gray-500 text-xs mt-1">Click Start Camera or switch back to Preview</p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {(status === 'loading-model' || status === 'loading-camera') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                <Loader2 className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
              </motion.div>
              <p className="text-white text-sm font-medium">
                {status === 'loading-model' ? 'Loading Pose AI...' : 'Accessing Camera...'}
              </p>
              <p className="text-gray-400 text-xs mt-1 max-w-[240px]">
                {status === 'loading-model'
                  ? 'Downloading MediaPipe model (~5MB, one-time)'
                  : 'Please allow camera access in your browser'}
              </p>
              {status === 'loading-camera' && (
                <div className="mt-3 flex justify-center gap-1">
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-green-400" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-green-400" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-green-400" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tracking stats bar */}
      {status === 'ready' && currentPose && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-xs">
          <Badge className="bg-green-500/15 text-green-300 border border-green-500/20">
            <Target className="h-3 w-3 mr-1" /> {visible}/33 landmarks
          </Badge>
          <Badge className="bg-blue-500/15 text-blue-300 border border-blue-500/20">
            <Move className="h-3 w-3 mr-1" /> Real-time tracking
          </Badge>
          <Badge className="bg-yellow-400/15 text-yellow-300 border border-yellow-400/20">
            <Sparkles className="h-3 w-3 mr-1" /> AR overlays active
          </Badge>
        </motion.div>
      )}
    </div>
  );
}
