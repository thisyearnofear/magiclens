import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { LM, bodyFrame, visFade, type Pt } from '@/lib/pose-frames';
import { resolveOverlayTransform, type AnchorId } from '@/lib/overlay-anchors';
import { drawGhostTrail } from '@/lib/ghost-trail';
import { ParticleSystem, type Emitter } from '@/lib/particles';
import type { SelectedOverlay } from '@/hooks/usePack';

export interface RemixExportOptions {
  /** the source clip element (same one shown in Track mode — must have crossOrigin=anonymous for remote URLs) */
  video: HTMLVideoElement;
  overlays: SelectedOverlay[];
  anchors?: Record<string, AnchorId>;
  /** per-overlay custom text (e.g. player-card headline) */
  texts?: Record<string, string>;
  opacities?: Record<string, number>;
  poseAt: (t: number) => NormalizedLandmark[] | null;
  onProgress?: (p: number) => void;
  /** cap export length (s) — matches the tracker */
  maxDuration?: number;
  /** draw a small MagicLens mark bottom-right (default true — free-tier distribution) */
  watermark?: boolean;
  /**
   * Static mode: per-overlay editor placements in container px plus the
   * container size they were authored against. When provided for an
   * overlay, its fixed placement wins over pose anchoring — this is what
   * Editor mode (and mobile manual placement) exports.
   */
  staticPlacements?: {
    styles: Record<string, { x: number; y: number; scale: number; rotation: number; opacity: number }>;
    srcW: number;
    srcH: number;
  };
}

export interface RemixExportResult {
  blob: Blob;
  mimeType: string;
  extension: 'webm' | 'mp4';
  duration: number;
}

const MAX_W = 1280;

/**
 * Static-export normalization: each overlay's DOM footprint in the editor
 * (base px, from StaticOverlayArt) and the ratio that converts a DOM-px
 * base size into drawArt's normalized-frame-fraction `s` parameter
 * (k = domBasePx / drawArtBaseFrac). w/h are the unscaled DOM footprint
 * used to convert the editor's top-left origin to drawArt's center origin.
 */
const STATIC_ART: Record<string, { k: number; w: number; h: number }> = {
  'flag-halos': { k: 40 / 0.064, w: 80, h: 80 },       // w-20 halo, drawArt r=0.064W
  'goal-lower-third': { k: 230 / 0.2, w: 230, h: 64 },  // px-8 py-4 GOAL!, drawArt w=0.2W
  'commentary-bubble': { k: 190 / 0.16, w: 190, h: 80 }, // max-w-[200px], drawArt w=0.16W
  'ref-card': { k: 76 / 0.055, w: 76, h: 65 },          // p-3 card, drawArt w=0.055W
  'player-card': { k: 160 / 0.13, w: 160, h: 74 },      // w-40 card, drawArt w=0.13W
};

function pickMime(): { mimeType: string; extension: 'webm' | 'mp4' } {
  const candidates: { mimeType: string; extension: 'webm' | 'mp4' }[] = [
    { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
    { mimeType: 'video/webm', extension: 'webm' },
    { mimeType: 'video/mp4', extension: 'mp4' },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mimeType)) return c;
  }
  return { mimeType: '', extension: 'webm' };
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Subtle bottom-right brand mark — free-tier distribution, not a lock. */
function drawWatermark(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const font = Math.max(10, Math.round(W * 0.016));
  const pad = Math.round(W * 0.02);
  const bolt = font * 0.9;
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.font = `bold ${font}px sans-serif`;
  ctx.fillStyle = '#facc15';
  // bolt glyph
  const bx = W - pad - ctx.measureText('MAGICLENS').width - bolt * 1.6;
  const by = H - pad - font;
  ctx.beginPath();
  ctx.moveTo(bx + bolt * 0.55, by);
  ctx.lineTo(bx + bolt * 0.15, by + bolt * 0.55);
  ctx.lineTo(bx + bolt * 0.42, by + bolt * 0.55);
  ctx.lineTo(bx + bolt * 0.3, by + bolt);
  ctx.lineTo(bx + bolt * 0.85, by + bolt * 0.42);
  ctx.lineTo(bx + bolt * 0.55, by + bolt * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('MAGICLENS', W - pad, H - pad);
  ctx.restore();
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/**
 * Records the tracked remix to a real video file: the clip is composited to a
 * canvas each frame with overlay art drawn at body-frame anchors (the same
 * resolveOverlayTransform math as the live layer) plus the velocity particle
 * systems, captured via canvas.captureStream + MediaRecorder.
 * This is what "bakes the trajectory into the exported remix" — the output
 * file carries the tracking, not just the preview.
 */
export async function exportRemixVideo(opts: RemixExportOptions): Promise<RemixExportResult> {
  const { video, overlays, anchors, texts, opacities, poseAt, onProgress } = opts;
  const watermark = opts.watermark !== false;
  const maxDuration = opts.maxDuration ?? 30;

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) throw new Error('Clip is not loaded');

  const scaleDown = Math.min(1, MAX_W / vw);
  const W = Math.round(vw * scaleDown);
  const H = Math.round(vh * scaleDown);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  // Preload flag art for the halo
  const flagUrls = new Set<string>();
  for (const o of overlays) {
    const u = o.chosenVariant?.flagUrl;
    if (u) flagUrls.add(u);
  }
  const flagImgs = new Map<string, HTMLImageElement>();
  await Promise.all(
    [...flagUrls].map(async (u) => {
      const img = await loadImage(u);
      if (img) flagImgs.set(u, img);
    }),
  );

  const wantsConfetti = overlays.some((o) => o.id === 'trophy-confetti');
  const wantsSparkles = overlays.some((o) => o.id === 'stadium-sparkles');
  const wantsGhost = overlays.some((o) => o.id === 'ghost-trail');
  const confetti = new ParticleSystem('confetti');
  const sparkles = new ParticleSystem('sparkles');

  const { mimeType, extension } = pickMime();
  if (!mimeType) throw new Error('Video recording is not supported in this browser');

  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise<void>((resolve) => {
    rec.onstop = () => resolve();
  });

  const end = Math.min(video.duration || maxDuration, maxDuration);

  // ── canvas overlay art (mirrors TrackedArt, in normalized-frame coords) ──
  const drawArt = (ov: SelectedOverlay, x: number, y: number, s: number, rotDeg: number, alpha: number, wallT: number) => {
    ctx.save();
    ctx.globalAlpha = Math.min(Math.max(alpha, 0), 1);
    ctx.translate(x, y);
    ctx.rotate((rotDeg * Math.PI) / 180);

    switch (ov.id) {
      case 'flag-halos': {
        const r = 0.064 * W * s; // ~48px radius at 1280 baseline ≈ w-24 DOM halo
        // spinning rings (rotation driven by wall time)
        ctx.save();
        ctx.rotate(wallT * 0.8);
        ctx.strokeStyle = 'rgba(74,222,128,0.55)';
        ctx.lineWidth = Math.max(2, r * 0.08);
        for (let i = 0; i < 10; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, r, (i / 10) * Math.PI * 2, (i / 10) * Math.PI * 2 + Math.PI / 8);
          ctx.stroke();
        }
        ctx.restore();
        ctx.save();
        ctx.rotate(-wallT * 0.55);
        ctx.strokeStyle = 'rgba(250,204,21,0.35)';
        ctx.lineWidth = Math.max(1.5, r * 0.05);
        for (let i = 0; i < 12; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.82, (i / 12) * Math.PI * 2, (i / 12) * Math.PI * 2 + Math.PI / 10);
          ctx.stroke();
        }
        ctx.restore();
        // flag disc
        const img = ov.chosenVariant?.flagUrl ? flagImgs.get(ov.chosenVariant.flagUrl) : undefined;
        const fr = r * 0.62;
        ctx.beginPath();
        ctx.arc(0, 0, fr, 0, Math.PI * 2);
        ctx.clip();
        if (img) {
          ctx.drawImage(img, -fr, -fr, fr * 2, fr * 2);
        } else {
          const g = ctx.createLinearGradient(-fr, -fr, fr, fr);
          g.addColorStop(0, '#22c55e');
          g.addColorStop(1, '#eab308');
          ctx.fillStyle = g;
          ctx.fillRect(-fr, -fr, fr * 2, fr * 2);
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${Math.round(fr * 0.55)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('ML', 0, 0);
        }
        break;
      }
      case 'goal-lower-third': {
        const w = 0.2 * W * s;
        const h = w * 0.28;
        const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
        g.addColorStop(0, '#facc15');
        g.addColorStop(0.5, '#f97316');
        g.addColorStop(1, '#ef4444');
        ctx.fillStyle = g;
        rr(ctx, -w / 2, -h / 2, w, h, h * 0.28);
        ctx.fill();
        ctx.strokeStyle = 'rgba(253,224,71,0.5)';
        ctx.lineWidth = Math.max(1, h * 0.04);
        rr(ctx, -w / 2, -h / 2, w, h, h * 0.28);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = `900 ${Math.round(h * 0.52)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('G O A L !', 0, 1);
        break;
      }
      case 'commentary-bubble': {
        const w = 0.16 * W * s;
        const h = w * 0.42;
        ctx.fillStyle = 'rgba(17,24,39,0.88)';
        rr(ctx, -w / 2, -h / 2, w, h, h * 0.22);
        ctx.fill();
        ctx.strokeStyle = 'rgba(250,204,21,0.3)';
        ctx.lineWidth = Math.max(1, h * 0.03);
        rr(ctx, -w / 2, -h / 2, w, h, h * 0.22);
        ctx.stroke();
        // mic dot + LIVE chip
        ctx.beginPath();
        ctx.arc(-w / 2 + h * 0.3, -h * 0.18, h * 0.14, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.font = `bold ${Math.round(h * 0.16)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('LIVE', -w / 2 + h * 0.52, -h * 0.18);
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.round(h * 0.2)}px sans-serif`;
        ctx.fillText(texts?.[ov.id] || 'What a moment!', -w / 2 + h * 0.18, h * 0.22);
        break;
      }
      case 'ref-card': {
        const w = 0.055 * W * s;
        const h = w * 0.85;
        ctx.fillStyle = 'rgba(17,24,39,0.88)';
        rr(ctx, -w / 2, -h / 2, w, h, h * 0.12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(250,204,21,0.4)';
        ctx.lineWidth = Math.max(1, w * 0.04);
        rr(ctx, -w / 2, -h / 2, w, h, h * 0.12);
        ctx.stroke();
        ctx.fillStyle = '#facc15';
        rr(ctx, -w * 0.22, -h * 0.3, w * 0.44, h * 0.32, w * 0.04);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.round(h * 0.11)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BOOKED', 0, h * 0.28);
        break;
      }
      case 'player-card': {
        const accent = ov.chosenVariant?.accent ?? '#FFD700';
        const w = 0.13 * W * s;
        const h = w * 0.46;
        ctx.fillStyle = 'rgba(17,24,39,0.88)';
        rr(ctx, -w / 2, -h / 2, w, h, h * 0.16);
        ctx.fill();
        ctx.strokeStyle = `${accent}66`;
        ctx.lineWidth = Math.max(1.5, w * 0.015);
        rr(ctx, -w / 2, -h / 2, w, h, h * 0.16);
        ctx.stroke();
        // number badge
        const bw = w * 0.18;
        const bh = h * 0.26;
        ctx.fillStyle = accent;
        rr(ctx, -w / 2 + w * 0.06, -h / 2 + h * 0.12, bw, bh, bw * 0.2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.font = `900 ${Math.round(bh * 0.62)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('10', -w / 2 + w * 0.06 + bw / 2, -h / 2 + h * 0.12 + bh / 2 + 1);
        // rating
        ctx.fillStyle = accent;
        ctx.font = `bold ${Math.round(h * 0.11)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText('RATING', -w / 2 + w * 0.3, -h * 0.28);
        ctx.fillStyle = '#fff';
        ctx.font = `900 ${Math.round(h * 0.24)}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText('9.4', w / 2 - w * 0.07, -h * 0.28);
        // name + stat bars
        ctx.textAlign = 'left';
        ctx.font = `bold ${Math.round(h * 0.15)}px sans-serif`;
        ctx.fillText(texts?.[ov.id] || 'STAR PLAYER', -w / 2 + w * 0.06, h * 0.02);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        rr(ctx, -w / 2 + w * 0.06, h * 0.14, w * 0.88, h * 0.07, h * 0.035);
        ctx.fill();
        ctx.fillStyle = accent;
        rr(ctx, -w / 2 + w * 0.06, h * 0.14, w * 0.88 * 0.86, h * 0.07, h * 0.035);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        rr(ctx, -w / 2 + w * 0.06, h * 0.28, w * 0.88, h * 0.07, h * 0.035);
        ctx.fill();
        ctx.fillStyle = '#38BDF8';
        rr(ctx, -w / 2 + w * 0.06, h * 0.28, w * 0.88 * 0.64, h * 0.07, h * 0.035);
        ctx.fill();
        break;
      }
      default:
        break;
    }
    ctx.restore();
  };

  // ── record ──
  const wasPaused = video.paused;
  const prevTime = video.currentTime;

  video.currentTime = 0;
  await new Promise<void>((resolve) => {
    const on = () => {
      video.removeEventListener('seeked', on);
      resolve();
    };
    video.addEventListener('seeked', on);
    setTimeout(on, 2000);
  });

  rec.start(250);
  await video.play();

  const prevJoints = new Map<string, Pt>();
  let prevT = 0;
  let lastWall = performance.now();
  const t0 = performance.now();

  await new Promise<void>((resolve) => {
    const tick = () => {
      const now = performance.now();
      const wallDt = Math.min((now - lastWall) / 1000, 0.1);
      lastWall = now;
      const t = video.currentTime;
      if (t >= end - 0.02 || video.ended) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);

      ctx.drawImage(video, 0, 0, W, H);

      const lms = poseAt(t);
      const bf = lms ? bodyFrame(lms) : null;
      const vis = (idx: number) => (lms ? visFade(lms[idx]) : 0);

      if (wantsGhost) drawGhostTrail(ctx, poseAt, t, W, H);

      // particles first — they trail *behind* the DOM overlays in the live layer too
      if (wantsConfetti || wantsSparkles) {
        const rawDt = t - prevT;
        const dt = Math.max(rawDt, 1e-3);
        const emit = (name: string, p: Pt | null, v: number): Emitter | null => {
          const prev = prevJoints.get(name);
          prevJoints.set(name, p ?? prev ?? { x: 0, y: 0 });
          if (!p) return null;
          const vel =
            prev && rawDt > 0 && rawDt < 0.5
              ? { x: (p.x - prev.x) / dt, y: (p.y - prev.y) / dt }
              : { x: 0, y: 0 };
          return { pos: p, vel, strength: v };
        };
        const hands = [
          emit('wL', bf?.wristL ?? null, vis(LM.L_WRIST)),
          emit('wR', bf?.wristR ?? null, vis(LM.R_WRIST)),
        ].filter((e): e is Emitter => !!e);
        const feet = [
          emit('aL', bf?.ankleL ?? null, vis(LM.L_ANKLE)),
          emit('aR', bf?.ankleR ?? null, vis(LM.R_ANKLE)),
        ].filter((e): e is Emitter => !!e);
        if (wantsConfetti) {
          confetti.update(hands, wallDt, W, H);
          confetti.draw(ctx);
        }
        if (wantsSparkles) {
          sparkles.update([...feet, ...hands], wallDt, W, H);
          sparkles.draw(ctx);
        }
      }

      const wallT = (now - t0) / 1000;
      for (const ov of overlays) {
        const st = opts.staticPlacements?.styles[ov.id];
        const art = st ? STATIC_ART[ov.id] : undefined;
        if (st && art) {
          // Editor/manual placement — fixed position, not pose-anchored.
          // style.x/y is the art's top-left in container px (transform
          // origin 0 0); drawArt positions by center, so offset by half
          // the scaled DOM footprint. s = st.scale * domBasePx/drawFrac
          // normalizes drawArt's frame-fraction base to the DOM's px base.
          const sp = opts.staticPlacements!;
          const cx = ((st.x + (art.w * st.scale) / 2) / sp.srcW) * W;
          const cy = ((st.y + (art.h * st.scale) / 2) / sp.srcH) * H;
          const alpha = st.opacity * (opacities?.[ov.id] ?? 1);
          if (alpha <= 0.02) continue;
          drawArt(ov, cx, cy, (st.scale * art.k) / sp.srcW, st.rotation, alpha, wallT);
          continue;
        }
        if (st) continue; // static mode, pose-only overlay — nothing to draw
        const xform = resolveOverlayTransform(ov.id, lms, anchors);
        const alpha = xform.alpha * (opacities?.[ov.id] ?? 1);
        if (!xform.pos || alpha <= 0.02) continue;
        drawArt(ov, xform.pos.x * W, xform.pos.y * H, xform.scale, xform.rotDeg, alpha, wallT);
      }

      if (watermark) drawWatermark(ctx, W, H);

      prevT = t;
      onProgress?.(t / end);
    };
    requestAnimationFrame(tick);
  });

  video.pause();
  if (wasPaused) video.currentTime = prevTime;
  rec.stop();
  await stopped;
  stream.getTracks().forEach((tr) => tr.stop());
  onProgress?.(1);

  return {
    blob: new Blob(chunks, { type: mimeType }),
    mimeType,
    extension,
    duration: end,
  };
}
