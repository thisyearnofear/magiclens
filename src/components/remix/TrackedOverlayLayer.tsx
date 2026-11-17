import React, { useEffect, useRef } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { LM, bodyFrame, coverFit, visFade, type Pt } from '@/lib/pose-frames';
import { ParticleSystem, type Emitter } from '@/lib/particles';
import type { SelectedOverlay } from '@/hooks/usePack';

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

const DEFAULT_ANCHOR: Record<string, AnchorId> = {
  'flag-halos': 'head',
  'goal-lower-third': 'shoulder',
  'commentary-bubble': 'head',
  'ref-card': 'hands',
};

const MAX_SUBJECT_DOTS = 3;

interface TrackedOverlayLayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  poseAt: (t: number) => NormalizedLandmark[] | null;
  /** every tracked subject's anchor at t — powers the tap-to-pick dots */
  subjectsAt?: (t: number) => { id: number; point: Pt }[];
  selectedSubjectId?: number;
  onSelectSubject?: (id: number) => void;
  overlays: SelectedOverlay[];
  /** user opacity adjustments from the editor, keyed by overlay id */
  opacities?: Record<string, number>;
  /** per-overlay attach-point overrides */
  anchors?: Record<string, AnchorId>;
}

interface AnchorResult {
  pos: Pt | null;
  /** body-relative scale unit (head size or shoulder width) */
  unit: number;
  rotDeg: number;
  vis: number;
}

/**
 * Pose-aware overlay renderer: each rAF, samples the smoothed clip trajectory
 * at the video's current time and positions overlays from the body frame
 * (head/shoulder/wrist anchors, joint-line rotation, visibility fades).
 * Subject dots let the viewer retarget which player overlays follow;
 * a canvas particle layer emits velocity-reactive FX from wrists and ankles.
 * Positions are written directly to style for 60fps — no React re-render.
 * See docs/AR_EXPERIENCE_PLAN.md Phase 2.
 */
export function TrackedOverlayLayer({
  videoRef,
  poseAt,
  subjectsAt,
  selectedSubjectId,
  onSelectSubject,
  overlays,
  opacities,
  anchors,
}: TrackedOverlayLayerProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const dotRefs = useRef(new Map<number, HTMLButtonElement>());
  const particlesRef = useRef<{ confetti: ParticleSystem; sparkles: ParticleSystem } | null>(null);

  if (!particlesRef.current) {
    particlesRef.current = { confetti: new ParticleSystem('confetti'), sparkles: new ParticleSystem('sparkles') };
  }

  // Size the frame div to the video's drawn (object-cover) rect so normalized
  // landmark coords map 1:1 to % inside it; the rounded parent clips overflow.
  useEffect(() => {
    const box = boxRef.current;
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!box || !frame || !video) return;

    const fit = () => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;
      const { w, h, x, y } = coverFit(vw, vh, box.clientWidth, box.clientHeight);
      frame.style.width = `${w}px`;
      frame.style.height = `${h}px`;
      frame.style.left = `${x}px`;
      frame.style.top = `${y}px`;
      if (canvas) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    video.addEventListener('loadedmetadata', fit);
    return () => {
      ro.disconnect();
      video.removeEventListener('loadedmetadata', fit);
    };
  }, [videoRef]);

  // Per-frame positioning loop
  useEffect(() => {
    let raf = 0;
    const prevJoints = new Map<string, Pt>();
    let prevT = 0;
    let lastWall = performance.now();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const wallDt = Math.min((now - lastWall) / 1000, 0.1);
      lastWall = now;

      const video = videoRef.current;
      const frame = frameRef.current;
      if (!video || !frame || frame.clientWidth === 0) return;

      const t = video.currentTime;
      const rawDt = t - prevT;
      const dt = Math.max(rawDt, 1e-3);
      const lms = poseAt(t);
      const bf = lms ? bodyFrame(lms) : null;

      const vis = (idx: number) => (lms ? visFade(lms[idx]) : 0);
      const headVis = Math.min(vis(LM.L_EYE), vis(LM.R_EYE), vis(LM.NOSE));
      const shoulderVis = Math.min(vis(LM.L_SHOULDER), vis(LM.R_SHOULDER));

      const anchorPos = (kind: AnchorId): AnchorResult => {
        const none: AnchorResult = { pos: null, unit: 0.16, rotDeg: 0, vis: 0 };
        if (!bf) return none;
        switch (kind) {
          case 'head': {
            const h = bf.head;
            if (!h) return none;
            return {
              pos: h.c,
              unit: h.size,
              rotDeg: clampDeg((h.roll * 180) / Math.PI, 18) * 0.6,
              vis: headVis,
            };
          }
          case 'shoulder': {
            const s = bf.shoulder;
            if (!s) return none;
            return {
              pos: s.c,
              unit: s.width,
              rotDeg: clampDeg((s.tilt * 180) / Math.PI, 20) * 0.8,
              vis: shoulderVis,
            };
          }
          case 'hands': {
            const pts = [bf.wristL, bf.wristR].filter((p): p is Pt => !!p);
            if (pts.length === 0) return none;
            const pos = {
              x: pts.reduce((a, p) => a + p.x, 0) / pts.length,
              y: pts.reduce((a, p) => a + p.y, 0) / pts.length,
            };
            return {
              pos,
              unit: (bf.shoulder?.width ?? 0.28) * 0.5,
              rotDeg: 0,
              vis: Math.max(vis(LM.L_WRIST), vis(LM.R_WRIST)),
            };
          }
          case 'feet': {
            const pts = [bf.ankleL, bf.ankleR].filter((p): p is Pt => !!p);
            if (pts.length === 0) return none;
            const pos = {
              x: pts.reduce((a, p) => a + p.x, 0) / pts.length,
              y: pts.reduce((a, p) => a + p.y, 0) / pts.length,
            };
            return {
              pos,
              unit: bf.shoulder?.width ?? 0.28,
              rotDeg: 0,
              vis: Math.max(vis(LM.L_ANKLE), vis(LM.R_ANKLE)),
            };
          }
          default:
            return none;
        }
      };

      const setItem = (id: string, pos: Pt | null, scale: number, rotDeg: number, alpha: number) => {
        const el = itemRefs.current.get(id);
        if (!el) return;
        if (!pos || alpha <= 0.02) {
          el.style.opacity = '0';
          return;
        }
        el.style.opacity = String(alpha);
        el.style.left = `${pos.x * 100}%`;
        el.style.top = `${pos.y * 100}%`;
        el.style.transform = `translate(-50%, -50%) rotate(${rotDeg}deg) scale(${scale})`;
      };

      const userOpacity = (id: string) => opacities?.[id] ?? 1;
      const anchorFor = (id: string) => {
        const o = anchors?.[id];
        return anchorPos(o && o !== 'auto' ? o : (DEFAULT_ANCHOR[id] ?? 'shoulder'));
      };

      for (const ov of overlays) {
        const uo = userOpacity(ov.id);

        switch (ov.id) {
          case 'flag-halos': {
            const a = anchorFor(ov.id);
            // halo floats ~0.9 head-sizes above the anchor
            const scale = Math.min(Math.max(a.unit / 0.16, 0.5), 2.2);
            setItem(ov.id, a.pos ? { x: a.pos.x, y: a.pos.y - a.unit * 0.9 } : null, scale, a.rotDeg, a.vis * uo);
            break;
          }
          case 'goal-lower-third': {
            const a = anchorFor(ov.id);
            const scale = Math.min(Math.max(a.unit / 0.28, 0.55), 2.4);
            setItem(ov.id, a.pos ? { x: a.pos.x, y: a.pos.y + a.unit * 0.75 } : null, scale, a.rotDeg, a.vis * uo);
            break;
          }
          case 'commentary-bubble': {
            const a = anchorFor(ov.id);
            const scale = Math.min(Math.max(a.unit / 0.2, 0.55), 1.8);
            setItem(
              ov.id,
              a.pos ? { x: a.pos.x + a.unit * 0.85, y: a.pos.y - a.unit * 0.4 } : null,
              scale,
              -3,
              a.vis * uo,
            );
            break;
          }
          case 'ref-card': {
            const a = anchorFor(ov.id);
            const scale = Math.min(Math.max(a.unit / 0.16, 0.6), 1.8);
            setItem(ov.id, a.pos, scale, a.rotDeg - 8, a.vis * uo);
            break;
          }
          default:
            break;
        }
      }

      // Velocity-reactive particles — confetti off the hands, sparkles off the feet
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        const wantsConfetti = overlays.some((o) => o.id === 'trophy-confetti');
        const wantsSparkles = overlays.some((o) => o.id === 'stadium-sparkles');
        if (wantsConfetti || wantsSparkles) {
          const emit = (name: string, p: Pt | null, v: number): Emitter | null => {
            const prev = prevJoints.get(name);
            prevJoints.set(name, p ?? prev ?? { x: 0, y: 0 });
            if (!p) return null;
            // big/negative rawDt = a seek or loop wrap — zero velocity instead of a phantom burst
            const vel =
              prev && rawDt > 0 && rawDt < 0.5
                ? { x: (p.x - prev.x) / dt, y: (p.y - prev.y) / dt }
                : { x: 0, y: 0 };
            return { pos: p, vel, strength: v };
          };
          const hands: Emitter[] = [
            emit('wL', bf?.wristL ?? null, vis(LM.L_WRIST)),
            emit('wR', bf?.wristR ?? null, vis(LM.R_WRIST)),
          ].filter((e): e is Emitter => !!e);
          const feet: Emitter[] = [
            emit('aL', bf?.ankleL ?? null, vis(LM.L_ANKLE)),
            emit('aR', bf?.ankleR ?? null, vis(LM.R_ANKLE)),
          ].filter((e): e is Emitter => !!e);

          const fw = frame.clientWidth;
          const fh = frame.clientHeight;
          const ps = particlesRef.current!;
          if (wantsConfetti) {
            ps.confetti.update(hands, wallDt, fw, fh);
            ps.confetti.draw(ctx);
          }
          if (wantsSparkles) {
            ps.sparkles.update([...feet, ...hands], wallDt, fw, fh);
            ps.sparkles.draw(ctx);
          }
        }
      }

      // Subject picker dots — one per detected player, selected gets a ring
      if (subjectsAt) {
        const subjects = subjectsAt(t);
        for (let i = 0; i < MAX_SUBJECT_DOTS; i++) {
          const el = dotRefs.current.get(i);
          if (!el) continue;
          const s = subjects[i];
          if (!s) {
            el.style.opacity = '0';
            continue;
          }
          el.style.opacity = '1';
          el.style.left = `${s.point.x * 100}%`;
          el.style.top = `${Math.max(s.point.y - 0.06, 0.02) * 100}%`;
          el.dataset.subjectId = String(s.id);
          el.dataset.selected = String(s.id === selectedSubjectId);
        }
      }
      prevT = t;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [videoRef, poseAt, subjectsAt, selectedSubjectId, overlays, opacities, anchors]);

  const setItemRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  };
  const setDotRef = (i: number) => (el: HTMLButtonElement | null) => {
    if (el) dotRefs.current.set(i, el);
    else dotRefs.current.delete(i);
  };

  const wantsParticles = overlays.some((o) => o.id === 'trophy-confetti' || o.id === 'stadium-sparkles');
  const showPicker = !!subjectsAt && !!onSelectSubject;

  return (
    <div ref={boxRef} className="absolute inset-0 pointer-events-none">
      {/* frame div = drawn video rect; overflow may exceed the box (clipped by parent) */}
      <div ref={frameRef} className="absolute">
        {wantsParticles && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />}
        {overlays.map((ov) => (
          <div key={ov.id} ref={setItemRef(ov.id)} className="absolute opacity-0 will-change-transform">
            <TrackedArt overlay={ov} />
          </div>
        ))}
        {showPicker &&
          Array.from({ length: MAX_SUBJECT_DOTS }, (_, i) => (
            <button
              key={i}
              ref={setDotRef(i)}
              type="button"
              aria-label="Track this player"
              onClick={(e) => {
                const id = Number((e.currentTarget as HTMLElement).dataset.subjectId);
                if (id) onSelectSubject(id);
              }}
              className="absolute opacity-0 will-change-transform pointer-events-auto -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-purple-500/80 border-2 border-white/70 backdrop-blur-sm cursor-pointer transition-opacity data-[selected=true]:bg-yellow-400 data-[selected=true]:border-yellow-200 data-[selected=true]:ring-2 data-[selected=true]:ring-yellow-300/60"
            >
              <span className="sr-only">Switch tracked player</span>
            </button>
          ))}
      </div>
    </div>
  );
}

/** Pack-art visuals for tracked mode — mirrors the editor's overlay look. */
function TrackedArt({ overlay }: { overlay: SelectedOverlay }) {
  switch (overlay.id) {
    case 'flag-halos':
      return (
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-green-400/50 animate-[spin_8s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border-2 border-yellow-400/30 animate-[spin_12s_linear_infinite_reverse]" />
          {overlay.chosenVariant?.flagUrl ? (
            <img
              src={overlay.chosenVariant.flagUrl}
              alt=""
              className="absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)] rounded-full object-cover border-2 border-white/20 shadow-lg"
            />
          ) : (
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              ML
            </div>
          )}
        </div>
      );
    case 'goal-lower-third':
      return (
        <div className="px-8 py-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl shadow-2xl shadow-yellow-500/30 border border-yellow-300/50">
          <span className="text-white font-black text-3xl tracking-[0.15em] whitespace-nowrap">GOAL!</span>
        </div>
      );
    case 'commentary-bubble':
      return (
        <div className="bg-gray-900/85 backdrop-blur-md rounded-xl border border-yellow-400/30 p-3 shadow-xl max-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px]">🎙</div>
            <span className="text-yellow-400 text-[10px] font-bold">LIVE</span>
          </div>
          <p className="text-white text-sm leading-tight whitespace-nowrap">What a moment!</p>
        </div>
      );
    case 'ref-card':
      return (
        <div className="bg-gray-900/85 backdrop-blur-md rounded-lg border border-yellow-400/40 px-2.5 py-2 shadow-xl">
          <div className="w-7 h-5 bg-yellow-400 rounded-sm mx-auto" />
          <span className="text-[8px] text-white font-bold block text-center mt-1">BOOKED</span>
        </div>
      );
    case 'trophy-confetti':
    case 'stadium-sparkles':
      // rendered by the canvas particle layer — keep a mounted node so the id stays registered
      return <div className="w-0 h-0" />;
    default:
      return null;
  }
}
