import { useRef, useState, useCallback, useEffect } from 'react';
import type { PoseLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { loadPoseLandmarker } from '@/lib/pose-model';
import { PoseSmoother } from '@/lib/one-euro';
import { LM, type Pt } from '@/lib/pose-frames';

export type TrackerStatus = 'idle' | 'loading' | 'tracking' | 'ready' | 'error';

/** Pose sample rate — 10/s is plenty for overlay anchoring */
const SAMPLE_INTERVAL = 0.1;
const MAX_DURATION = 30;
const MAX_SUBJECTS = 3;
/** Max normalized distance a detection may jump to join an existing track */
const MATCH_RADIUS = 0.22;
/** Detection gaps longer than this end interpolation — no sliding across cuts */
const GAP_TOLERANCE = 0.5;

export interface SubjectTrack {
  id: number;
  /** sparse smoothed samples, ascending t */
  samples: { t: number; landmarks: NormalizedLandmark[] }[];
  /** mean shoulder width — proxy for how big/close the subject is */
  prominence: number;
}

export interface ClipPoseTracker {
  status: TrackerStatus;
  progress: number;
  error: string | null;
  /** Detected subjects, most prominent first */
  tracks: SubjectTrack[];
  selectedTrackId: number;
  setSelectedTrackId: (id: number) => void;
  /** Interpolated (already smoothed) landmarks for the selected subject at clip time t */
  poseAt: (t: number) => NormalizedLandmark[] | null;
  /** Anchor point of every tracked subject at t — for the picker dots */
  subjectsAt: (t: number) => { id: number; point: Pt }[];
  track: () => void;
  reset: () => void;
}

/** Stable assignment keypoint: shoulder midpoint, then nose, then mean of all. */
function anchorOf(lms: NormalizedLandmark[]): Pt {
  const ls = lms[LM.L_SHOULDER];
  const rs = lms[LM.R_SHOULDER];
  if (ls && rs && (ls.visibility ?? 0) > 0.3 && (rs.visibility ?? 0) > 0.3) {
    return { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
  }
  const nose = lms[LM.NOSE];
  if (nose && (nose.visibility ?? 0) > 0.3) return { x: nose.x, y: nose.y };
  let x = 0;
  let y = 0;
  for (const l of lms) {
    x += l.x;
    y += l.y;
  }
  return { x: x / lms.length, y: y / lms.length };
}

function prominenceOf(lms: NormalizedLandmark[]): number {
  const ls = lms[LM.L_SHOULDER];
  const rs = lms[LM.R_SHOULDER];
  if (!ls || !rs) return 0.05;
  return Math.hypot(ls.x - rs.x, ls.y - rs.y);
}

/** Interpolate within one track's sparse samples; null across detection gaps. */
function sampleTrack(track: SubjectTrack, t: number): NormalizedLandmark[] | null {
  const s = track.samples;
  if (s.length === 0 || t < s[0].t || t > s[s.length - 1].t) return null;
  let lo = 0;
  let hi = s.length - 1;
  if (s[hi].t === t) return s[hi].landmarks;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = s[lo];
  const b = s[hi];
  if (b.t - a.t > GAP_TOLERANCE) return t - a.t < GAP_TOLERANCE / 2 ? a.landmarks : null;
  const k = Math.min(Math.max((t - a.t) / (b.t - a.t || 1), 0), 1);
  return a.landmarks.map((la, i) => {
    const lb = b.landmarks[i];
    return {
      ...la,
      x: la.x + (lb.x - la.x) * k,
      y: la.y + (lb.y - la.y) * k,
      visibility: Math.min(la.visibility ?? 0, lb.visibility ?? 0),
    };
  });
}

/**
 * Runs PoseLandmarker over an uploaded clip (any video URL) by seeking a hidden
 * video element frame-by-frame — same model as the webcam demo, no backend.
 * Keeps up to MAX_SUBJECTS persistent subjects: each frame's detections are
 * greedily assigned to the nearest existing track, so overlays stick to one
 * player through crowded frames instead of hopping. Returns smoothed,
 * time-indexed trajectories sampled during playback.
 * See docs/AR_EXPERIENCE_PLAN.md Phase 2.
 */
export function useClipPoseTracker(clipVideoUrl: string | null): ClipPoseTracker {
  const [status, setStatus] = useState<TrackerStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<SubjectTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState(0);
  const tracksRef = useRef<SubjectTrack[]>([]);
  const runIdRef = useRef(0);

  const reset = useCallback(() => {
    runIdRef.current++;
    tracksRef.current = [];
    setTracks([]);
    setSelectedTrackId(0);
    setStatus('idle');
    setProgress(0);
    setError(null);
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
      tracksRef.current = [];
      setTracks([]);

      let landmarker: PoseLandmarker | null = null;
      try {
        landmarker = await loadPoseLandmarker({ numPoses: MAX_SUBJECTS });
      } catch {
        if (alive()) {
          setError('Could not load the pose model. Try Chrome or Edge.');
          setStatus('error');
        }
        return;
      }
      if (!alive()) {
        landmarker.close();
        return;
      }

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = clipVideoUrl;

      try {
        await new Promise<void>((resolve, reject) => {
          const to = setTimeout(() => reject(new Error('Clip load timed out')), 20000);
          video.onloadedmetadata = () => {
            clearTimeout(to);
            resolve();
          };
          video.onerror = () => {
            clearTimeout(to);
            reject(new Error('Could not load clip for analysis'));
          };
        });
      } catch (e) {
        landmarker.close();
        if (alive()) {
          setError(e instanceof Error ? e.message : 'Could not load clip');
          setStatus('error');
        }
        return;
      }
      if (!alive()) {
        landmarker.close();
        return;
      }

      const duration = Math.min(video.duration || 0, MAX_DURATION);
      if (!duration) {
        landmarker.close();
        if (alive()) {
          setError('Clip has no duration');
          setStatus('error');
        }
        return;
      }

      setStatus('tracking');

      // Live tracks being assembled — each gets its own smoother (causal, in-order)
      interface LiveTrack {
        id: number;
        samples: { t: number; landmarks: NormalizedLandmark[] }[];
        smoother: PoseSmoother;
        lastAnchor: Pt;
        prominenceSum: number;
      }
      const live: LiveTrack[] = [];
      let nextId = 1;

      const finish = (err?: string) => {
        landmarker!.close();
        video.src = '';
        if (err && alive()) {
          setError(err);
          setStatus('error');
        }
      };

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
          const detections = res.landmarks ?? [];

          // Greedy nearest-anchor assignment, best match first
          const pairs: { di: number; ti: number; d: number }[] = [];
          detections.forEach((lms, di) => {
            const a = anchorOf(lms);
            live.forEach((tr, ti) => {
              const d = Math.hypot(a.x - tr.lastAnchor.x, a.y - tr.lastAnchor.y);
              if (d < MATCH_RADIUS) pairs.push({ di, ti, d });
            });
          });
          pairs.sort((p, q) => p.d - q.d);
          const usedD = new Set<number>();
          const usedT = new Set<number>();
          for (const p of pairs) {
            if (usedD.has(p.di) || usedT.has(p.ti)) continue;
            usedD.add(p.di);
            usedT.add(p.ti);
            const tr = live[p.ti];
            const lms = detections[p.di];
            tr.samples.push({ t, landmarks: tr.smoother.smooth(lms, t * 1000) });
            tr.lastAnchor = anchorOf(lms);
            tr.prominenceSum += prominenceOf(lms);
          }
          for (let di = 0; di < detections.length; di++) {
            if (usedD.has(di) || live.length >= MAX_SUBJECTS) continue;
            const lms = detections[di];
            const a = anchorOf(lms);
            const smoother = new PoseSmoother();
            live.push({
              id: nextId++,
              samples: [{ t, landmarks: smoother.smooth(lms, t * 1000) }],
              smoother,
              lastAnchor: a,
              prominenceSum: prominenceOf(lms),
            });
          }
          setProgress(t / duration);
        }
      } catch {
        finish('Pose analysis failed — the clip may block pixel access (CORS).');
        return;
      }

      finish();
      if (!alive()) return;

      const done: SubjectTrack[] = live
        .filter((tr) => tr.samples.length >= 3) // ignore flicker detections
        .map((tr) => ({
          id: tr.id,
          samples: tr.samples,
          prominence: tr.prominenceSum / tr.samples.length,
        }))
        // rank by prominence × coverage — a big player tracked for 2s is a
        // worse default than a slightly smaller one tracked the whole clip
        .sort((a, b) => b.prominence * Math.min(b.samples.length / 30, 1.5) - a.prominence * Math.min(a.samples.length / 30, 1.5));

      tracksRef.current = done;
      setTracks(done);
      setSelectedTrackId(done[0]?.id ?? 0);
      setProgress(1);
      setStatus('ready');
    })();
  }, [clipVideoUrl]);

  // Re-track when the clip changes
  useEffect(() => {
    reset();
  }, [clipVideoUrl, reset]);

  const poseAt = useCallback(
    (t: number): NormalizedLandmark[] | null => {
      const tr = tracksRef.current.find((x) => x.id === selectedTrackId) ?? tracksRef.current[0];
      return tr ? sampleTrack(tr, t) : null;
    },
    [selectedTrackId],
  );

  const subjectsAt = useCallback((t: number): { id: number; point: Pt }[] => {
    const out: { id: number; point: Pt }[] = [];
    for (const tr of tracksRef.current) {
      const lms = sampleTrack(tr, t);
      if (lms) out.push({ id: tr.id, point: anchorOf(lms) });
    }
    return out;
  }, []);

  return {
    status,
    progress,
    error,
    tracks,
    selectedTrackId,
    setSelectedTrackId,
    poseAt,
    subjectsAt,
    track,
    reset,
  };
}
