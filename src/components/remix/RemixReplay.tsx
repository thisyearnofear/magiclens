'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePack, type SelectedOverlay } from '@/hooks/usePack';
import { useClipPoseTracker } from '@/hooks/useClipPoseTracker';
import { TrackedOverlayLayer } from '@/components/remix/TrackedOverlayLayer';
import { StaticOverlayArt } from '@/components/remix/StaticOverlayArt';
import type { RemixState } from '@/lib/remix-state';
import type { AnchorId } from '@/lib/overlay-anchors';

/**
 * Replays a minted remix from its stored RemixState — the public face of the
 * NFT. Track mode re-runs the clip pose tracker in-browser (deterministic, so
 * the author's subject pick survives); static mode replays editor placements.
 */
export function RemixReplay({ state }: { state: RemixState }) {
  const { manifest } = usePack();
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [posScale, setPosScale] = useState(1);

  const isTrack = state.mode === 'track';
  const tracker = useClipPoseTracker(isTrack ? state.clipUrl : null);
  const {
    status: trackStatus,
    progress: trackProgress,
    poseAt,
    subjectsAt,
    selectedTrackId,
    setSelectedTrackId,
    track: startTracking,
  } = tracker;

  // Rehydrate full overlay definitions from the pack manifest; fall back to a
  // minimal definition so an unknown/retired overlay id doesn't break replay.
  const overlays: SelectedOverlay[] = useMemo(() => {
    return state.overlays.map((o) => {
      const def = manifest?.overlays.find((d) => d.id === o.id);
      return {
        id: o.id,
        name: def?.name ?? o.id,
        type: def?.type ?? 'overlay',
        description: def?.description ?? '',
        previewColor: def?.previewColor ?? '#888',
        thumbnail: def?.thumbnail ?? '',
        icon: def?.icon ?? 'sparkles',
        position: def?.position,
        variants: def?.variants,
        chosenVariant: o.variant
          ? (def?.variants?.find((v) => v.name === o.variant?.name) ?? o.variant)
          : null,
      };
    });
  }, [state.overlays, manifest]);

  const anchors = useMemo(
    () => Object.fromEntries(state.overlays.map((o) => [o.id, o.anchor]).filter(([, a]) => a)) as Record<string, AnchorId>,
    [state.overlays],
  );
  const texts = useMemo(
    () => Object.fromEntries(state.overlays.map((o) => [o.id, o.style?.text ?? '']).filter(([, t]) => t)),
    [state.overlays],
  );
  const opacities = useMemo(
    () => Object.fromEntries(state.overlays.map((o) => [o.id, o.style?.opacity ?? 1])),
    [state.overlays],
  );

  // Auto-run clip analysis for tracked replays
  useEffect(() => {
    if (isTrack && trackStatus === 'idle') startTracking();
  }, [isTrack, trackStatus, startTracking]);

  // Restore the author's subject pick once analysis lands
  useEffect(() => {
    if (trackStatus === 'ready' && state.subjectId !== undefined) {
      setSelectedTrackId(state.subjectId);
    }
  }, [trackStatus, state.subjectId, setSelectedTrackId]);

  // Static-mode position scaling (styles authored on sourceSize canvas)
  useEffect(() => {
    if (isTrack) return;
    const el = boxRef.current;
    if (!el || !state.sourceSize?.w) return;
    const ro = new ResizeObserver(([entry]) => {
      setPosScale(entry.contentRect.width / state.sourceSize!.w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isTrack, state.sourceSize]);

  return (
    <div ref={boxRef} className="relative aspect-video bg-black overflow-hidden">
      <video
        ref={videoRef}
        src={state.clipUrl}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        muted
        loop
        playsInline
        autoPlay
      />

      {isTrack ? (
        trackStatus === 'ready' ? (
          <TrackedOverlayLayer
            videoRef={videoRef}
            poseAt={poseAt}
            subjectsAt={subjectsAt}
            selectedSubjectId={selectedTrackId}
            onSelectSubject={setSelectedTrackId}
            overlays={overlays}
            opacities={opacities}
            anchors={anchors}
            texts={texts}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-300">
                {trackStatus === 'error'
                  ? 'AR replay unavailable for this remix'
                  : `Rebuilding AR tracking… ${Math.round(trackProgress * 100)}%`}
              </p>
            </div>
          </div>
        )
      ) : (
        overlays.map((o, i) => (
          <StaticOverlayArt key={o.id} overlay={o} style={state.overlays[i]?.style} posScale={posScale} />
        ))
      )}

      <div className="absolute bottom-2 left-2 text-[10px] text-white/70 bg-black/50 rounded px-1.5 py-0.5 pointer-events-none">
        {isTrack ? 'Pose-tracked AR' : 'AR remix'} · {state.clipTitle}
      </div>
    </div>
  );
}
