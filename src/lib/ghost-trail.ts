import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { LM, visFade, type Pt } from '@/lib/pose-frames';

/** Ages (s) of each echo, oldest last — drawn back-to-front */
const ECHO_AGES = [1.5, 1.2, 0.95, 0.7, 0.45, 0.22];
const MAX_AGE = ECHO_AGES[0];

const BONES: [number, number][] = [
  [LM.L_SHOULDER, LM.R_SHOULDER],
  [LM.L_SHOULDER, LM.L_ELBOW],
  [LM.L_ELBOW, LM.L_WRIST],
  [LM.R_SHOULDER, LM.R_ELBOW],
  [LM.R_ELBOW, LM.R_WRIST],
  [LM.L_SHOULDER, LM.L_HIP],
  [LM.R_SHOULDER, LM.R_HIP],
  [LM.L_HIP, LM.R_HIP],
  [LM.L_HIP, LM.L_KNEE],
  [LM.L_KNEE, LM.L_ANKLE],
  [LM.R_HIP, LM.R_KNEE],
  [LM.R_KNEE, LM.R_ANKLE],
];

const JOINTS = [
  LM.NOSE,
  LM.L_SHOULDER, LM.R_SHOULDER,
  LM.L_ELBOW, LM.R_ELBOW,
  LM.L_WRIST, LM.R_WRIST,
  LM.L_HIP, LM.R_HIP,
  LM.L_KNEE, LM.R_KNEE,
  LM.L_ANKLE, LM.R_ANKLE,
];

function drawEcho(ctx: CanvasRenderingContext2D, lms: NormalizedLandmark[], W: number, H: number, alpha: number) {
  const px = (l: NormalizedLandmark): Pt => ({ x: l.x * W, y: l.y * H });
  const scaleUnit = Math.max(
    (() => {
      const ls = lms[LM.L_SHOULDER];
      const rs = lms[LM.R_SHOULDER];
      return ls && rs ? Math.hypot(ls.x - rs.x, ls.y - rs.y) : 0.15;
    })(),
    0.06,
  );

  ctx.strokeStyle = `rgba(165, 243, 252, ${alpha * 0.75})`; // ghostly ice-cyan
  ctx.lineWidth = Math.max(1.5, scaleUnit * W * 0.045);
  ctx.lineCap = 'round';
  for (const [a, b] of BONES) {
    const la = lms[a];
    const lb = lms[b];
    if (visFade(la) < 0.5 || visFade(lb) < 0.5) continue;
    const pa = px(la);
    const pb = px(lb);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }
  for (const j of JOINTS) {
    const l = lms[j];
    if (visFade(l) < 0.5) continue;
    const p = px(l);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(2, scaleUnit * W * 0.028), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(224, 254, 255, ${alpha})`;
    ctx.fill();
  }
}

/**
 * "Ghost Player" — replays the tracked subject's last ~1.5s as fading
 * skeleton echoes behind their current position. Drawn on the overlay
 * canvas each frame; the trajectory lookup is the caller's smoothed poseAt.
 */
export function drawGhostTrail(
  ctx: CanvasRenderingContext2D,
  poseAt: (t: number) => NormalizedLandmark[] | null,
  t: number,
  W: number,
  H: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const age of ECHO_AGES) {
    const lms = poseAt(t - age);
    if (!lms) continue;
    const alpha = 0.55 * (1 - age / (MAX_AGE + 0.3));
    drawEcho(ctx, lms, W, H, Math.max(alpha, 0.05));
  }
  ctx.restore();
}
