import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

/** MediaPipe pose landmark indices */
export const LM = {
  NOSE: 0,
  L_EYE_INNER: 1,
  L_EYE: 2,
  R_EYE: 5,
  L_EAR: 7,
  R_EAR: 8,
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_ELBOW: 13,
  R_ELBOW: 14,
  L_WRIST: 15,
  R_WRIST: 16,
  L_HIP: 23,
  R_HIP: 24,
  L_ANKLE: 27,
  R_ANKLE: 28,
} as const;

export interface Pt {
  x: number;
  y: number;
}

export interface BodyFrame {
  /** Head center (mid-eye), head size heuristic, head roll (rad) — all normalized */
  head: { c: Pt; size: number; roll: number } | null;
  /** Shoulder center, width, and tilt (rad) */
  shoulder: { c: Pt; width: number; tilt: number } | null;
  wristL: Pt | null;
  wristR: Pt | null;
  ankleL: Pt | null;
  ankleR: Pt | null;
}

const VIS_LO = 0.3;
const VIS_HI = 0.6;

function ok(lm: NormalizedLandmark | undefined): lm is NormalizedLandmark {
  return !!lm && (lm.visibility ?? 0) > VIS_LO;
}

/** 0→1 fade as landmark visibility crosses VIS_LO→VIS_HI */
export function visFade(lm: NormalizedLandmark | undefined | null): number {
  if (!lm) return 0;
  const v = lm.visibility ?? 0;
  if (v <= VIS_LO) return 0;
  if (v >= VIS_HI) return 1;
  return (v - VIS_LO) / (VIS_HI - VIS_LO);
}

function pt(lm: NormalizedLandmark): Pt {
  return { x: lm.x, y: lm.y };
}

/**
 * Derives body-frame anchors from a (smoothed) pose. All in normalized coords.
 * Snap Lens Studio-style: scale from shoulder width / head size, rotation from
 * joint-line tilt — never absolute pixel offsets.
 */
export function bodyFrame(l: NormalizedLandmark[]): BodyFrame {
  const nose = l[LM.NOSE];
  const le = l[LM.L_EYE];
  const re = l[LM.R_EYE];
  const lear = l[LM.L_EAR];
  const rear = l[LM.R_EAR];
  const ls = l[LM.L_SHOULDER];
  const rs = l[LM.R_SHOULDER];

  let head: BodyFrame['head'] = null;
  if (ok(le) && ok(re)) {
    const eyeDist = Math.hypot(le.x - re.x, le.y - re.y);
    const roll = Math.atan2(le.y - re.y, le.x - re.x);
    head = {
      c: { x: (le.x + re.x) / 2, y: (le.y + re.y) / 2 },
      // ear-to-ear is a better head-width proxy when visible
      size: ok(lear) && ok(rear) ? Math.hypot(lear.x - rear.x, lear.y - rear.y) : eyeDist * 2.4,
      roll,
    };
  } else if (ok(nose)) {
    head = { c: pt(nose), size: 0.12, roll: 0 };
  }

  const shoulder =
    ok(ls) && ok(rs)
      ? {
          c: { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 },
          width: Math.hypot(ls.x - rs.x, ls.y - rs.y),
          tilt: Math.atan2(ls.y - rs.y, ls.x - rs.x),
        }
      : null;

  return {
    head,
    shoulder,
    wristL: ok(l[LM.L_WRIST]) ? pt(l[LM.L_WRIST]) : null,
    wristR: ok(l[LM.R_WRIST]) ? pt(l[LM.R_WRIST]) : null,
    ankleL: ok(l[LM.L_ANKLE]) ? pt(l[LM.L_ANKLE]) : null,
    ankleR: ok(l[LM.R_ANKLE]) ? pt(l[LM.R_ANKLE]) : null,
  };
}

/** Dominant anchor visibility for gating overlay opacity */
export function anchorVisibility(l: NormalizedLandmark[], indices: number[]): number {
  return Math.min(...indices.map((i) => visFade(l[i])));
}

/**
 * Maps a normalized video point to a CSS rect for an `object-cover` video.
 * The drawn frame overflows the box and is cropped; overlays positioned in the
 * frame's coordinate space follow the picture, then the container clips them.
 */
export function coverFit(videoW: number, videoH: number, boxW: number, boxH: number) {
  const scale = Math.max(boxW / videoW, boxH / videoH);
  const w = videoW * scale;
  const h = videoH * scale;
  return { w, h, x: (boxW - w) / 2, y: (boxH - h) / 2 };
}
