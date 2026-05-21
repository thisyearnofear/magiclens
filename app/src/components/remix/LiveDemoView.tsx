import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoseLandmarker } from '@/hooks/usePoseLandmarker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, CameraOff, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

interface LiveDemoViewProps {
  selectedPackId: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'loading-model': { label: 'Loading AI model...', color: 'text-yellow-400', icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  'loading-camera': { label: 'Starting camera...', color: 'text-yellow-400', icon: <Camera className="h-4 w-4 animate-pulse" /> },
  ready: { label: 'Pose tracking active', color: 'text-green-400', icon: <Camera className="h-4 w-4" /> },
  error: { label: 'Error', color: 'text-red-400', icon: <AlertTriangle className="h-4 w-4" /> },
  unavailable: { label: 'Camera off', color: 'text-gray-400', icon: <CameraOff className="h-4 w-4" /> },
};

/** Get overlay position from a specific landmark */
function landmarkPosition(
  landmarks: NormalizedLandmark[],
  index: number,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } | null {
  const lm = landmarks[index];
  if (!lm || (lm.visibility ?? 0) < 0.3) return null;
  return { x: lm.x * canvasWidth, y: lm.y * canvasHeight };
}

// MediaPipe pose landmark indices we track
const LANDMARK = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
};

export function LiveDemoView({ selectedPackId }: LiveDemoViewProps) {
  const { videoRef, canvasRef, status, error, currentPose, isActive, start, stop } = usePoseLandmarker();

  useEffect(() => {
    return () => { if (isActive) stop(); };
  }, []);

  const cfg = STATUS_CONFIG[status];

  // Calculate overlay positions based on pose landmarks
  const overlayPositions = currentPose?.landmarks
    ? {
        head: landmarkPosition(currentPose.landmarks, LANDMARK.NOSE, 640, 480),
        leftShoulder: landmarkPosition(currentPose.landmarks, LANDMARK.LEFT_SHOULDER, 640, 480),
        rightShoulder: landmarkPosition(currentPose.landmarks, LANDMARK.RIGHT_SHOULDER, 640, 480),
        leftWrist: landmarkPosition(currentPose.landmarks, LANDMARK.LEFT_WRIST, 640, 480),
        rightWrist: landmarkPosition(currentPose.landmarks, LANDMARK.RIGHT_WRIST, 640, 480),
      }
    : null;

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cfg.color}>{cfg.icon}</span>
          <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
          {status === 'ready' && currentPose && (
            <Badge className="bg-green-500/20 text-green-300 text-xs">
              {currentPose.landmarks.length} landmarks
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {!isActive ? (
            <Button
              onClick={start}
              size="sm"
              className="bg-yellow-400 text-black hover:bg-yellow-500"
            >
              <Camera className="h-4 w-4 mr-1" /> Start Camera
            </Button>
          ) : (
            <Button
              onClick={stop}
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <CameraOff className="h-4 w-4 mr-1" /> Stop
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {status === 'error' && error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-300 text-sm font-medium">{error}</p>
              <p className="text-red-400/60 text-xs mt-1">Try using Chrome on desktop with a webcam connected.</p>
            </div>
            <Button
              onClick={start}
              size="sm"
              variant="outline"
              className="border-red-400/30 text-red-300 hover:bg-red-500/10"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Video + Canvas container */}
      <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-white/10">
        {/* Hidden video element (drives the canvas) */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          playsInline
          muted
        />

        {/* Overlay canvas for skeleton + tracked AR overlays */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full scale-x-[-1]"
        />

        {/* Pose-tracked AR overlays rendered as React elements */}
        {status === 'ready' && overlayPositions && (
          <>
            {/* Flag halo at head position */}
            {overlayPositions.head && (
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  left: `${overlayPositions.head.x - 30}px`,
                  top: `${overlayPositions.head.y - 70}px`,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold">
                  {selectedPackId === 'flag-halos' ? '🏆' : '⚽'}
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-yellow-400/50 animate-ping" />
              </motion.div>
            )}

            {/* Commentary bubble at left shoulder */}
            {overlayPositions.leftShoulder && (
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  left: `${overlayPositions.leftShoulder.x + 20}px`,
                  top: `${overlayPositions.leftShoulder.y - 60}px`,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 150, delay: 0.1 }}
              >
                <div className="bg-gray-900/80 backdrop-blur-md rounded-xl border border-yellow-400/40 px-3 py-2 shadow-xl">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[8px] text-white font-bold">LIVE</span>
                    <span className="text-yellow-400 text-[10px] font-bold">TRACKING</span>
                  </div>
                  <p className="text-white text-xs whitespace-nowrap">33 pose landmarks</p>
                </div>
              </motion.div>
            )}

            {/* Wrist particles for celebrations */}
            {overlayPositions.leftWrist && overlayPositions.rightWrist && (
              <>
                <motion.div
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full pointer-events-none"
                  style={{ left: `${overlayPositions.leftWrist.x}px`, top: `${overlayPositions.leftWrist.y}px` }}
                  animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute w-2 h-2 bg-blue-400 rounded-full pointer-events-none"
                  style={{ left: `${overlayPositions.rightWrist.x}px`, top: `${overlayPositions.rightWrist.y}px` }}
                  animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                />
              </>
            )}
          </>
        )}

        {/* Idle state overlay */}
        {status === 'unavailable' && !isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <CameraOff className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">Camera inactive</p>
              <p className="text-gray-600 text-xs mt-1">Click "Start Camera" to activate pose tracking</p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {(status === 'loading-model' || status === 'loading-camera') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="h-10 w-10 text-yellow-400 mx-auto mb-3 animate-spin" />
              <p className="text-white text-sm font-medium">
                {status === 'loading-model' ? 'Loading AI Model...' : 'Accessing Camera...'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {status === 'loading-model' ? 'Downloading pose detection model (~5MB)' : 'Please allow camera access'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Landmark key */}
      {status === 'ready' && currentPose && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 text-xs"
        >
          <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">Nose</Badge>
          <Badge className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">Shoulders</Badge>
          <Badge className="bg-green-400/20 text-green-300 border border-green-400/30">Wrists</Badge>
          <span className="text-gray-500 ml-auto">
            {currentPose.landmarks.filter(l => (l.visibility ?? 0) > 0.5).length} visible landmarks
          </span>
        </motion.div>
      )}
    </div>
  );
}
