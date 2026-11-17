import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { LM, bodyFrame, visFade, type BodyFrame, type Pt } from '@/lib/pose-frames';

const clampDeg = (deg: number, max: number) => Math.min(Math.max(deg, -max), max);

/** Where an overlay anchors on the body. 'auto' = the overlay's own default. */
export type AnchorId = 'auto' | 'head' | 'shoulder' | 'hands' | 'feet';
export const ANCHOR_OPTIONS: { id: AnchorId; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'head', label: 'Head' },
  { id: 'shoulder', label: 'Shoulder' },
  { id: 'hands', label: 'Hands' },
  { id: 'feet', label: 'Feet' },
];

export const DEFAULT_ANCHOR: Record<string, AnchorId> = {
  'flag-halos': 'head',
  'goal-lower-third': 'shoulder',
  'commentary-bubble': 'head',
  'ref-card': 'hands',
  'player-card': 'head',
};

interface AnchorResult {
  pos: Pt | null;
  /** body-relative scale unit (head size or shoulder width) */
  unit: number;
  rotDeg: number;
  vis: number;
}

const NONE: AnchorResult = { pos: null, unit: 0.16, rotDeg: 0, vis: 0 };

function anchorPos(lms: NormalizedLandmark[], bf: BodyFrame, kind: AnchorId): AnchorResult {
  const vis = (idx: number) => visFade(lms[idx]);
  switch (kind) {
    case 'head': {
      const h = bf.head;
      if (!h) return NONE;
      return {
        pos: h.c,
        unit: h.size,
        rotDeg: clampDeg((h.roll * 180) / Math.PI, 18) * 0.6,
        vis: Math.min(vis(LM.L_EYE), vis(LM.R_EYE), vis(LM.NOSE)),
      };
    }
    case 'shoulder': {
      const s = bf.shoulder;
      if (!s) return NONE;
      return {
        pos: s.c,
        unit: s.width,
        rotDeg: clampDeg((s.tilt * 180) / Math.PI, 20) * 0.8,
        vis: Math.min(vis(LM.L_SHOULDER), vis(LM.R_SHOULDER)),
      };
    }
    case 'hands': {
      const pts = [bf.wristL, bf.wristR].filter((p): p is Pt => !!p);
      if (pts.length === 0) return NONE;
      return {
        pos: {
          x: pts.reduce((a, p) => a + p.x, 0) / pts.length,
          y: pts.reduce((a, p) => a + p.y, 0) / pts.length,
        },
        unit: (bf.shoulder?.width ?? 0.28) * 0.5,
        rotDeg: 0,
        vis: Math.max(vis(LM.L_WRIST), vis(LM.R_WRIST)),
      };
    }
    case 'feet': {
      const pts = [bf.ankleL, bf.ankleR].filter((p): p is Pt => !!p);
      if (pts.length === 0) return NONE;
      return {
        pos: {
          x: pts.reduce((a, p) => a + p.x, 0) / pts.length,
          y: pts.reduce((a, p) => a + p.y, 0) / pts.length,
        },
        unit: bf.shoulder?.width ?? 0.28,
        rotDeg: 0,
        vis: Math.max(vis(LM.L_ANKLE), vis(LM.R_ANKLE)),
      };
    }
    default:
      return NONE;
  }
}

export interface OverlayTransform {
  /** normalized position (may leave 0..1 — the frame clips), null = hide */
  pos: Pt | null;
  scale: number;
  rotDeg: number;
  alpha: number;
}

const HIDE: OverlayTransform = { pos: null, scale: 1, rotDeg: 0, alpha: 0 };

/**
 * Resolves an overlay's final placement from a pose — the single source of
 * truth shared by the live tracked layer and the canvas exporter. Anchors are
 * body-relative (head size / shoulder width), rotation from joint-line tilt,
 * alpha gated by landmark visibility.
 */
export function resolveOverlayTransform(
  overlayId: string,
  lms: NormalizedLandmark[] | null,
  anchors: Record<string, AnchorId> | undefined,
): OverlayTransform {
  if (!lms) return HIDE;
  const bf = bodyFrame(lms);
  const o = anchors?.[overlayId];
  const a = anchorPos(lms, bf, o && o !== 'auto' ? o : (DEFAULT_ANCHOR[overlayId] ?? 'shoulder'));

  switch (overlayId) {
    case 'flag-halos':
      return {
        pos: a.pos ? { x: a.pos.x, y: a.pos.y - a.unit * 0.9 } : null,
        scale: Math.min(Math.max(a.unit / 0.16, 0.5), 2.2),
        rotDeg: a.rotDeg,
        alpha: a.vis,
      };
    case 'goal-lower-third':
      return {
        pos: a.pos ? { x: a.pos.x, y: a.pos.y + a.unit * 0.75 } : null,
        scale: Math.min(Math.max(a.unit / 0.28, 0.55), 2.4),
        rotDeg: a.rotDeg,
        alpha: a.vis,
      };
    case 'commentary-bubble':
      return {
        pos: a.pos ? { x: a.pos.x + a.unit * 0.85, y: a.pos.y - a.unit * 0.4 } : null,
        scale: Math.min(Math.max(a.unit / 0.2, 0.55), 1.8),
        rotDeg: -3,
        alpha: a.vis,
      };
    case 'ref-card':
      return {
        pos: a.pos,
        scale: Math.min(Math.max(a.unit / 0.16, 0.6), 1.8),
        rotDeg: a.rotDeg - 8,
        alpha: a.vis,
      };
    case 'player-card':
      // broadcast stat card floats beside the head
      return {
        pos: a.pos ? { x: a.pos.x + a.unit * 1.35, y: a.pos.y - a.unit * 0.35 } : null,
        scale: Math.min(Math.max(a.unit / 0.16, 0.5), 2.0),
        rotDeg: a.rotDeg * 0.3,
        alpha: a.vis,
      };
    default:
      return HIDE;
  }
}
