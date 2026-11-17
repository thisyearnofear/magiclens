import React, { useEffect, useRef } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { LM, bodyFrame, coverFit, visFade, type Pt } from '@/lib/pose-frames';
import type { SelectedOverlay } from '@/hooks/usePack';

const clampDeg = (deg: number, max: number) => Math.min(Math.max(deg, -max), max);

interface TrackedOverlayLayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  poseAt: (t: number) => NormalizedLandmark[] | null;
  overlays: SelectedOverlay[];
  /** user opacity adjustments from the editor, keyed by overlay id */
  opacities?: Record<string, number>;
}

/**
 * Pose-aware overlay renderer: each rAF, samples the smoothed clip trajectory at
 * the video's current time and positions overlays from the body frame
 * (head/shoulder/wrist anchors, joint-line rotation, visibility fades).
 * Positions are written directly to style for 60fps — no React re-render.
 * See docs/AR_EXPERIENCE_PLAN.md Phase 1.
 */
export function TrackedOverlayLayer({ videoRef, poseAt, overlays, opacities }: TrackedOverlayLayerProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const dotRefs = useRef(new Map<string, HTMLDivElement>());

  // Size the frame div to the video's drawn (object-cover) rect so normalized
  // landmark coords map 1:1 to % inside it; the rounded parent clips overflow.
  useEffect(() => {
    const box = boxRef.current;
    const frame = frameRef.current;
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
    let prevWristL: Pt | null = null;
    let prevWristR: Pt | null = null;
    let prevT = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const video = videoRef.current;
      const frame = frameRef.current;
      if (!video || !frame || frame.clientWidth === 0) return;

      const t = video.currentTime;
      const dt = Math.max(t - prevT, 1e-3);
      const lms = poseAt(t);
      const bf = lms ? bodyFrame(lms) : null;

      const setItem = (id: string, pos: { x: number; y: number } | null, scale: number, rotDeg: number, alpha: number) => {
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

      const setDot = (id: string, p: Pt | null, alpha: number, scale: number) => {
        const el = dotRefs.current.get(id);
        if (!el) return;
        if (!p || alpha <= 0.02) {
          el.style.opacity = '0';
          return;
        }
        el.style.opacity = String(alpha);
        el.style.left = `${p.x * 100}%`;
        el.style.top = `${p.y * 100}%`;
        el.style.transform = `translate(-50%, -50%) scale(${scale})`;
      };

      const userOpacity = (id: string) => opacities?.[id] ?? 1;

      for (const ov of overlays) {
        const vis = (idx: number) => (lms ? visFade(lms[idx]) : 0);
        const headVis = Math.min(vis(LM.L_EYE), vis(LM.R_EYE), vis(LM.NOSE));
        const shoulderVis = Math.min(vis(LM.L_SHOULDER), vis(LM.R_SHOULDER));
        const uo = userOpacity(ov.id);

        switch (ov.id) {
          case 'flag-halos': {
            const h = bf?.head;
            // halo floats ~0.9 head-sizes above the eyes, scales + rolls with the head
            const scale = h ? Math.min(Math.max(h.size / 0.16, 0.5), 2.2) : 1;
            const roll = h ? clampDeg((h.roll * 180) / Math.PI, 18) : 0;
            setItem(ov.id, h ? { x: h.c.x, y: h.c.y - h.size * 0.9 } : null, scale, roll * 0.6, headVis * uo);
            break;
          }
          case 'goal-lower-third': {
            const s = bf?.shoulder;
            const scale = s ? Math.min(Math.max(s.width / 0.28, 0.55), 2.4) : 1;
            // clamp tilt — a leaning player reads great, a detection glitch going vertical doesn't
            const tilt = s ? clampDeg((s.tilt * 180) / Math.PI, 20) : 0;
            setItem(ov.id, s ? { x: s.c.x, y: s.c.y + s.width * 0.75 } : null, scale, tilt * 0.8, shoulderVis * uo);
            break;
          }
          case 'commentary-bubble': {
            const h = bf?.head;
            const s = bf?.shoulder;
            const sw = s?.width ?? 0.28;
            const scale = Math.min(Math.max(sw / 0.28, 0.55), 1.8);
            const pos = h
              ? { x: h.c.x + sw * 0.85, y: h.c.y - (h.size ?? 0.15) * 0.4 }
              : s
                ? { x: s.c.x + s.width * 0.85, y: s.c.y - s.width * 0.4 }
                : null;
            setItem(ov.id, pos, scale, -3, Math.max(headVis, shoulderVis) * uo);
            break;
          }
          case 'ref-card': {
            // card rides the raised right wrist when visible — a held card — else the shoulder
            const rw = bf?.wristR;
            const s = bf?.shoulder;
            const wristVis = vis(LM.R_WRIST);
            const pos = rw ?? (s ? { x: s.c.x + s.width * 0.55, y: s.c.y - s.width * 0.15 } : null);
            const alpha = (rw ? wristVis : shoulderVis) * uo;
            const h = bf?.head;
            const scale = h ? Math.min(Math.max(h.size / 0.16, 0.6), 1.8) : 1;
            setItem(ov.id, pos, scale, rw ? -8 : 0, alpha);
            break;
          }
          default:
            break;
        }
      }

      // Wrist particles — celebration FX tracks both wrists, dot size reacts to speed
      const wantsParticles = overlays.some((o) => o.id === 'trophy-confetti' || o.id === 'stadium-sparkles');
      if (wantsParticles) {
        const speedOf = (cur: Pt | null, prev: Pt | null) => (cur && prev ? Math.hypot(cur.x - prev.x, cur.y - prev.y) / dt : 0);
        const sL = speedOf(bf?.wristL ?? null, prevWristL);
        const sR = speedOf(bf?.wristR ?? null, prevWristR);
        setDot('wristL', bf?.wristL ?? null, lms ? visFade(lms[LM.L_WRIST]) : 0, 1 + Math.min(sL * 0.6, 2));
        setDot('wristR', bf?.wristR ?? null, lms ? visFade(lms[LM.R_WRIST]) : 0, 1 + Math.min(sR * 0.6, 2));
        prevWristL = bf?.wristL ?? null;
        prevWristR = bf?.wristR ?? null;
      }
      prevT = t;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [videoRef, poseAt, overlays, opacities]);

  const setItemRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  };
  const setDotRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) dotRefs.current.set(id, el);
    else dotRefs.current.delete(id);
  };

  const wantsParticles = overlays.some((o) => o.id === 'trophy-confetti' || o.id === 'stadium-sparkles');

  return (
    <div ref={boxRef} className="absolute inset-0 pointer-events-none">
      {/* frame div = drawn video rect; overflow may exceed the box (clipped by parent) */}
      <div ref={frameRef} className="absolute">
        {overlays.map((ov) => (
          <div key={ov.id} ref={setItemRef(ov.id)} className="absolute opacity-0 will-change-transform">
            <TrackedArt overlay={ov} />
          </div>
        ))}
        {wantsParticles && (
          <>
            <div
              ref={setDotRef('wristL')}
              className="absolute w-2.5 h-2.5 rounded-full opacity-0 will-change-transform bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-yellow-400/50"
            />
            <div
              ref={setDotRef('wristR')}
              className="absolute w-2.5 h-2.5 rounded-full opacity-0 will-change-transform bg-gradient-to-r from-blue-400 to-purple-500 shadow-lg shadow-blue-400/50"
            />
          </>
        )}
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
    default:
      return null;
  }
}
