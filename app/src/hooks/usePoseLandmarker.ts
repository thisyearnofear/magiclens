import { useRef, useState, useCallback, useEffect } from 'react';
import { PoseLandmarker, FilesetResolver, type NormalizedLandmark } from '@mediapipe/tasks-vision';

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm';
const MODEL_PATH = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

export interface PoseData {
  landmarks: NormalizedLandmark[];
  timestamp: number;
}

export type PoseStatus = 'loading-model' | 'loading-camera' | 'ready' | 'error' | 'unavailable';

interface UsePoseLandmarkerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: PoseStatus;
  error: string | null;
  currentPose: PoseData | null;
  isActive: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

export function usePoseLandmarker(): UsePoseLandmarkerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const runningRef = useRef(false);

  const [status, setStatus] = useState<PoseStatus>('unavailable');
  const [error, setError] = useState<string | null>(null);
  const [currentPose, setCurrentPose] = useState<PoseData | null>(null);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCurrentPose(null);
    setStatus('unavailable');
  }, []);

  const start = useCallback(async () => {
    try {
      setStatus('loading-model');
      setError(null);

      // 1. Load WASM runtime
      const wasmFileset = await FilesetResolver.forVisionTasks(WASM_BASE);

      // 2. Create pose landmarker
      const landmarker = await PoseLandmarker.createFromOptions(wasmFileset, {
        baseOptions: {
          modelAssetPath: MODEL_PATH,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        minPoseDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      landmarkerRef.current = landmarker;

      // 3. Start webcam
      setStatus('loading-camera');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;

      if (!videoRef.current) throw new Error('Video ref not mounted');
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // 4. Start detection loop
      runningRef.current = true;
      setStatus('ready');

      const detectLoop = () => {
        if (!runningRef.current || !videoRef.current || !landmarkerRef.current) return;

        const now = performance.now();
        const result = landmarkerRef.current.detectForVideo(videoRef.current, now);

        if (result.landmarks && result.landmarks.length > 0) {
          setCurrentPose({
            landmarks: result.landmarks[0],
            timestamp: now,
          });

          // Draw on canvas
          drawPose(result.landmarks[0]);
        } else {
          // Clear canvas when no pose detected
          clearCanvas();
        }

        animFrameRef.current = requestAnimationFrame(detectLoop);
      };

      animFrameRef.current = requestAnimationFrame(detectLoop);

    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
        setError('Camera access denied or unavailable. Please grant camera permissions.');
      } else if (err.message?.includes('WebGL') || err.message?.includes('Wasm')) {
        setError('WebGL not supported in this browser. Try Chrome or Edge.');
      } else {
        setError(err.message || 'Failed to start pose detection');
      }
      setStatus('error');
      stop();
    }
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      landmarkerRef.current?.close();
    };
  }, []);

  function drawPose(landmarks: NormalizedLandmark[]) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw landmarks
    landmarks.forEach((lm, i) => {
      const x = lm.x * canvas.width;
      const y = lm.y * canvas.height;

      // Confidence-based opacity
      const alpha = (lm.visibility ?? 0.8);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
      ctx.fill();
    });

    // Draw skeleton connections
    const connections = PoseLandmarker.POSE_CONNECTIONS;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
    ctx.lineWidth = 2;
    connections.forEach((conn) => {
      const i = conn.start;
      const j = conn.end;
      const a = landmarks[i];
      const b = landmarks[j];
      if (a && b && (a.visibility ?? 0) > 0.3 && (b.visibility ?? 0) > 0.3) {
        ctx.beginPath();
        ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
        ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
        ctx.stroke();
      }
    });
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return {
    videoRef,
    canvasRef,
    status,
    error,
    currentPose,
    isActive: runningRef.current,
    start,
    stop,
  };
}
