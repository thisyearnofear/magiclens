import { useRef, useState, useCallback, useEffect } from 'react';
import type { PoseLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { loadPoseLandmarker } from '@/lib/pose-model';
import { PoseSmoother } from '@/lib/one-euro';

export interface TrackedFrame {
  /** clip time in seconds */
  t: number;
  landmarks: NormalizedLandmark[] | null;
}

export type TrackerStatus = 'idle' | 'loading' | 'tracking' | 'ready' | 'error';

/** Pose sample rate — 10/s is plenty for overlay anchoring */
const SAMPLE_INTERVAL = 0.1;
const MAX_DURATION = 30;

export interface ClipPoseTracker {
  status: TrackerStatus;
  progress: number;
  error: string | null;
  frames: TrackedFrame[];
  /** Interpolated (already smoothed) landmarks at clip time t, or null */
  poseAt: (t: number) => NormalizedLandmark[] | null;
  track: () => void;
  reset: () => void;
}

/**
 * Runs PoseLandmarker over an uploaded clip (any video URL) by seeking a hidden
 * video element frame-by-frame — same model as the webcam demo, no backend.
 * Returns smoothed, time-indexed trajectories the overlay layer samples during
 * playback. See docs/AR_EXPERIENCE_PLAN.md.
 */
export function useClipPoseTracker(clipVideoUrl: string | null): ClipPoseTracker {
  const [status, setStatus] = useState<TrackerStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const framesRef = useRef<TrackedFrame[]>([]);
  const [, setReady] = useState(false);
  const runIdRef = useRef(0);

  const reset = useCallback(() => {
    runIdRef.current++;
    framesRef.current = [];
    setStatus('idle');
    setProgress(0);
    setError(null);
    setReady(false);
  }, []);

  const track = useCallback(() => {
    if (!clipVideoUrl) {
      setError('No clip selected');
      setStatus('error');
      return;
    }
    const runId = ++runIdRef.current;
    const alive = () => runId === runIdRef.current;

    (async () => {
      setError(null);
      setStatus('loading');
      setProgress(0);
      framesRef.current = [];

      let landmarker: PoseLandmarker | null = null;
      try {
        landmarker = await loadPoseLandmarker();
      } catch {
        if (alive()) {
          setError('Could not load the pose model. Try Chrome or Edge.');
          setStatus('error');
        }
        return;
      }
      if (!alive()) { landmarker.close(); return; }

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = clipVideoUrl;

      try {
        await new Promise<void>((resolve, reject) => {
          const to = setTimeout(() => reject(new Error('Clip load timed out')), 20000);
          video.onloadedmetadata = () => { clearTimeout(to); resolve(); };
          video.onerror = () => { clearTimeout(to); reject(new Error('Could not load clip for analysis')); };
        });
      } catch (e) {
        landmarker.close();
        if (alive()) {
          setError(e instanceof Error ? e.message : 'Could not load clip');
          setStatus('error');
        }
        return;
      }
      if (!alive()) { landmarker.close(); return; }

      const duration = Math.min(video.duration || 0, MAX_DURATION);
      if (!duration) {
        landmarker.close();
        if (alive()) { setError('Clip has no duration'); setStatus('error'); }
        return;
      }

      setStatus('tracking');
      const raw: TrackedFrame[] = [];

      try {
        for (let t = 0; t < duration && alive(); t += SAMPLE_INTERVAL) {
          await new Promise<void>((resolve, reject) => {
            const to = setTimeout(() => reject(new Error('seek timeout')), 8000);
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              clearTimeout(to);
              resolve();
            };
            video.addEventListener('seeked', onSeeked);
            video.currentTime = t;
          });
          if (!alive()) break;
          const res = landmarker.detectForVideo(video, Math.max(t * 1000, 1));
          raw.push({ t, landmarks: res.landmarks?.[0] ?? null });
          setProgress(t / duration);
        }
      } catch {
        landmarker.close();
        video.src = '';
        if (alive()) {
          setError('Pose analysis failed — the clip may block pixel access (CORS).');
          setStatus('error');
        }
        return;
      }

      landmarker.close();
      video.src = '';
      if (!alive()) return;

      // Smooth the whole trajectory — causal pass, same filter as live mode
      const smoother = new PoseSmoother();
      const smoothed = raw.map((f) => ({
        t: f.t,
        landmarks: f.landmarks ? smoother.smooth(f.landmarks, f.t * 1000) : null,
      }));
      framesRef.current = smoothed;
      setProgress(1);
      setStatus('ready');
      setReady(true);
    })();
  }, [clipVideoUrl]);

  // Re-track when the clip changes
  useEffect(() => {
    reset();
  }, [clipVideoUrl, reset]);

  const poseAt = useCallback((t: number): NormalizedLandmark[] | null => {
    const frames = framesRef.current;
    if (frames.length === 0) return null;
    // Binary search for the bracketing pair, then lerp
    let lo = 0;
    let hi = frames.length - 1;
    if (t <= frames[0].t) return frames[0].landmarks;
    if (t >= frames[hi].t) return frames[hi].landmarks;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (frames[mid].t <= t) lo = mid; else hi = mid;
    }
    const a = frames[lo];
    const b = frames[hi];
    if (!a.landmarks || !b.landmarks) return a.landmarks ?? b.landmarks;
    const k = Math.min(Math.max((t - a.t) / (b.t - a.t || 1), 0), 1);
    return a.landmarks.map((la, i) => {
      const lb = b.landmarks![i];
      return {
        ...la,
        x: la.x + (lb.x - la.x) * k,
        y: la.y + (lb.y - la.y) * k,
        visibility: Math.min(la.visibility ?? 0, lb.visibility ?? 0),
      };
    });
  }, []);

  return { status, progress, error, frames: framesRef.current, poseAt, track, reset };
}
