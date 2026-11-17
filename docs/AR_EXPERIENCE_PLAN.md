# MagicLens AR Experience — Honest Assessment & Best-in-Class Plan

Research: Tavily (Nov 2026) — MediaPipe docs, Casiez CHI'12 One Euro paper,
Snap Lens Studio body-attachment docs, MediaPipe Selfie Segmentation, sports
broadcast AR (wTVision/Vizrt), CapCut velocity-edit breakdowns.

> **Status (Nov 2026): Phases 1 + 2 (partial) shipped.** Clip-based pose
> tracking is live — "Track Player" mode in `ARWorkspace` analyzes the
> selected clip in-browser (`PoseLandmarker.detectForVideo`, frame-stepped),
> One-Euro-smooths trajectories, and drives overlays from body-frame anchors
> rendered with real pack SVG art — no emoji. Verified end-to-end on the
> close-up `celebration-goal.mp4` fixture: flag halo locks onto the scorer's
> head, GOAL banner tilts with his torso, confetti sprays off the wrists
> during the celebration scrum.
>
> **Phase 2 shipped:** multi-subject tracking (`numPoses: 3`, greedy
> nearest-anchor assignment into persistent per-subject tracks, prominence
> × coverage default selection), tap-a-dot subject switching, per-overlay
> attach-point picker (auto/head/shoulder/hands/feet), and a canvas particle
> layer (`src/lib/particles.ts`) where wrist/ankle speed drives emission and
> celebration spikes fire radial bursts.
>
> **Phase 3 shipped (canvas-composite path):** "Export video" in Track
> Player records the tracked remix to a real file —
> `src/lib/remix-exporter.ts` composites video + overlay art +
> particles to a canvas via `captureStream` + `MediaRecorder` (VP9 WebM,
> mp4 fallback), driven by the same `resolveOverlayTransform`
> (`src/lib/overlay-anchors.ts`) that powers the live layer. Verified:
> 16.5MB webm with the halo locked to the keeper and confetti baked in.
>
> **Public replay shipped:** minted remixes now carry a `remix_state`
> recipe in the token metadata `attributes` JSONB (no backend schema
> change — see `src/lib/remix-state.ts`). `PublicRemix` resolves
> txHash→tokenId from the Transfer receipt (or a bare tokenId),
> fetches the recipe, and `RemixReplay` rebuilds the real output —
> `mode:'track'` re-runs `useClipPoseTracker` on the clip and restores
> the author's subject pick (verified live: stat card with the author's
> custom name text anchored to the tracked player, ghost-trail echoes
> painting, subject dots switchable); `mode:'static'` replays editor
> placements via the shared `StaticOverlayArt` also used by
> `RemixPreview`. Mints minted before `remix_state` fall back to the
> legacy card. A first-class `remix_state` metadata column remains a
> cleaner long-term home if the backend schema ever migrates.
>
> **Phase 2 remaining:** occlusion via segmentation (#6) — the canvas
> pipeline now exists, so masks can composite behind the subject in a
> future pass. **Phase 3 remaining:** face/hand landmarkers, optional
> server-side track preprocessing. Live webcam mode shares the same
> One Euro smoothing.
>
> **Harvested overlays shipped:** two concepts borrowed from
> consumption-side AR ideas (Ghost Player + AR Sports Lens), reworked
> for creation-side use — `ghost-trail` replays the selected subject's
> last ~1.5s of body poses as fading cyan echoes
> (`src/lib/ghost-trail.ts`, drawn on the shared particle canvas and in
> the exporter), and `player-card` is a broadcast-style stat card
> anchored beside the tracked head (3 accent variants, double-click
> editable name text that flows to preview + export). Verified live:
> subject switching retargets both, visibility gating fades them when
> the subject is lost, and a 9.5MB exported webm bakes echoes + card
> into the video.

## What "AR" means in MagicLens today

Three disconnected pieces:

| Piece | What it does | The gap |
|-------|--------------|---------|
| `LiveDemoView` (webcam) | MediaPipe lite → raw landmarks → 4 emoji overlays pinned to nose/shoulders/wrists | **Demo, not product.** Tracks the *viewer*, not the clip's athletes |
| `ARWorkspace` (editor) | Static DOM sticker drag/drop on the video preview | No temporal behavior — overlays can't follow motion |
| Backend `computer_vision.py` | Real MediaPipe pose extraction per clip (7 upper-body landmarks, cached) | Used only for **safe-zone suggestions** and pose similarity — no per-frame trajectory reaches the output |

**The promised experience doesn't exist end-to-end:** an overlay that tracks a
celebrating athlete through the clip. Pose data is extracted per frame, but no
per-frame trajectory ever drives overlay placement in the rendered remix. The
minted output is just static `styles` — whatever x/y the sticker had at export
time (or the last webcam pose frame in live mode, which is worse).

## Specific deficiencies vs. best-in-class

1. **No smoothing.** Raw landmarks → CSS `left/top` every rAF frame = jitter city.
   The standard is the **One Euro filter** (Casiez, CHI 2012): a velocity-adaptive
   low-pass — smooth when still, responsive when moving. ~50 lines, zero deps.
   Every production lens does velocity-adaptive smoothing.
2. **Absolute pixel anchoring.** `head.x - 56` hardcoded offsets on a fixed
   640×480 canvas — breaks on any other size/aspect. Snap's body-attachment model
   derives the full transform from the **body frame**: shoulder width → scale,
   shoulder line tilt → rotation, normalized coords → any canvas size.
3. **Emoji art in "AR" mode.** Live mode renders `🏆` circles and a CSS "GOAL!"
   banner while the actual pack SVGs go unused — quality drops exactly when the
   feature is supposed to impress.
4. **Skeleton debug always on.** Yellow dots + blue bones read as dev tooling.
   Best-in-class shows a clean tracked result; skeleton is an opt-in debug layer.
5. **No occlusion.** Overlays always paint on top. MediaPipe Selfie Segmentation
   (or `outputSegmentationMasks` on PoseLandmarker) gives a person mask — the
   signature "effect wraps behind the athlete" moment.
6. **No velocity-reactive FX.** CapCut edits live on velocity/shake/blur. Wrist
   speed should drive particle emission and trail length — currently two pulsing
   dots regardless of motion.
7. **No tracking persistence.** The live demo evaporates; nothing tracked reaches
   the minted remix.

## The big unlock — track the clip, not just the webcam

`PoseLandmarker.detectForVideo` accepts **any** `<video>` element. The same lite
model we already load can run over the uploaded clip itself, in-browser, at edit
time:

```
clip video element → detectForVideo per frame → {landmarks, t} per frame
  → per-landmark trajectory → One-Euro smooth → attach overlays to trajectory
  → RemixPreview scrubs/plays with overlays following the athlete
```

For 8–15s highlight clips this is a few hundred frames — a second or two of
processing, all client-side, no backend change. **This converts MagicLens from
"sticker editor + webcam demo" into actual pose-aware remixing.**

## Implementation plan (priority order)

### Phase 1 — make tracking feel real (frontend only)

1. **`useSmoothedPose`** — One Euro filter per landmark
   (`minCutoff ~1.0`, `beta ~0.007`, `dCutoff 1.0` as starting tune, in
   `src/hooks/`). Apply in both live mode and clip tracking.
2. **Clip tracking mode** — `useClipPoseTracker(clipVideoUrl)`: load video
   element offscreen, `detectForVideo` frame-stepped (match clip fps, cap ~10s),
   produce `Map<landmark, Array<{x,y,t,vis}>>` + progress UI.
3. **Body-frame transforms** — replace absolute offsets with:
   `scale = shoulderDist / baseline`, `rotation = atan2(shoulderΔy, shoulderΔx)`,
   head anchor = midpoints of eyes/ears, not raw nose.
4. **Use pack SVG art** in tracked mode (the `match-day` thumbs already exist) —
   kill the emoji circles.
5. **Visibility-gated fade** — opacity follows landmark `visibility`; overlays
   dissolve when the athlete leaves frame instead of freezing mid-air.

### Phase 2 — the "wow" layer

6. **Occlusion via segmentation** — `outputSegmentationMasks: true` on
   PoseLandmarker (or Selfie Segmentation on clip frames); canvas-composite
   overlay layers so art can sit *behind* the subject's silhouette.
7. **Velocity-reactive particles** — wrist/ankle speed → emission rate, trail
   length, shake amplitude. Canvas particle layer (reuse `ParticleBurst`
   concepts, not DOM).
8. **Multi-subject pick** — detect `numPoses: 2+`, "tap the player to track"
   (nearest-click assignment), per-subject trajectories.
9. **Attach-point picker** — tap a body part to re-anchor an overlay; visual
   joint map instead of the debug skeleton.

### Phase 3 — export + richer landmarks

10. **Bake trajectory into output** — the tracked path must reach the rendered
    remix (extend `styles` → per-frame keyframes at render, or canvas-recorded
    composite). Without this, tracking stays a preview toy.
11. **Face + hand landmarkers** — FaceLandmarker (478 pts) for celebration-face
    triggers, HandLandmarker (21 pts) for held props. Same `FilesetResolver`,
    lazily loaded.
12. **Backend option** — `computer_vision.py` already extracts per-frame pose on
    clips; extend to per-subject trajectories (add ankles/knees, subject IDs) so
    placement is precomputed once server-side and the client just scrubs.

## Sources

- One Euro filter — Casiez et al., CHI 2012 (`gery.casiez.net/publications/CHI2012-casiez.pdf`)
- MediaPipe Holistic / landmarkers — `developers.google.com/edge/mediapipe/solutions/vision/holistic_landmarker`
- `detectForVideo` on file video — MediaPipe JS render-loop pattern (webai.show/models/pose-landmarker)
- Snap Lens Studio — `developers.snap.com/lens-studio` body/hand tracking templates (18-point attachment, match-hierarchy rigs)
- MediaPipe Selfie Segmentation — person mask for occlusion/background effects
- Broadcast AR anchoring — SVG/FEED on wTVision + Vizrt (field-anchored vs player-anchored graphics)
- Velocity-edit aesthetic — CapCut velocity/shake/directional-blur breakdowns
