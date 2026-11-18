# UX Delight Plan — Making the Remix Flow Intuitive

**Context:** User feedback (Nov 2026): "the flow doesn't yet feel intuitive and delightful."
Written from verified behavior — the core complaint maps to a real dead-air moment, not taste.

## Diagnosis

The workspace defaults to track mode → pose analysis runs for seconds → **selecting an overlay produces zero visual response** (TrackedOverlayLayer only renders when tracking is `ready`). Users tap an effect, see nothing, assume broken. Compounded by jargon modes ("🎬 Editor" vs "Track Player"), an invisible manual path, and no payoff at export.

## Phase 1 — Kill the dead air

### 1.1 Ghost-while-tracking + lock-on reveal
**Files:** `ARWorkspace.tsx`, `TrackedOverlayLayer.tsx`, new `LockOnReticle.tsx`

- During `loading`/`tracking` with `selected.length > 0`: render ghost overlays (`StaticOverlayArt` at seeded position, ~50% opacity, subtle pulse) + "will lock to player" chip.
- On `ready`: 500ms lock-on — SVG reticle brackets converge onto the player bounding box, ghosts crossfade to tracked anchors, chip flips to "Player locked ✓".
- On `ready` with no subjects: ghosts persist, chip → "No player — drag overlays into place", auto-switch to Editor mode.

### 1.2 Intent-language modes
- `🎬 Editor` → **"Place manually"**; `Track Player` → **"Follow player"**
- One-line caption under active mode; keep icons for continuity.

### 1.3 Visible manual path + next-step signal
- Amber "no player" banner gains one-tap "Switch to Place manually" button.
- Once `selected.length >= 1`: "Preview Remix" CTA gets subtle framer-motion glow pulse.

## Phase 2 — Payoff and tactility

### 2.1 Export/mint payoff screen
**Files:** new `ExportSuccess.tsx`, `ARWorkspace.tsx` export path; reuse share-card canvas + confetti emitter from `IconicMomentFocus`

- On export/mint success: full-screen panel — confetti burst, video thumbnail, share-card preview, one-tap **Post to X** / **Copy remix link** / **Download again**.

### 2.2 Selection tactility
- Overlay cards: `whileTap` scale + spring; selected = yellow ring + check badge.
- `FerroSoundToggle` tick on select (respects user pref).
- Overlays spring-enter on first mount (`scale 0.6→1` overshoot).

## Phase 3 — Pro-feel editor

### 3.1 Smart guides
**Files:** `EditorOverlay.tsx`, new `src/lib/smart-guides.ts`

- Drag snaps to frame center-lines + 8px edges (~6px threshold), cyan guide lines while snapped.
- With a loaded track: magnetic snap to nearest landmark anchor (~12px) via `overlay-anchors.ts`.
- Magnetic not rigid — pull past threshold to break free.

## Phase 4 — Discovery

### 4.1 Mobile overlay carousel
- Horizontal `snap-x snap-mandatory` carousel of `w-36` thumbnail cards pinned under canvas.

### 4.2 Coach marks — instrumented, deferred
- No tooltip tour. Log funnel events (clip→armed→committed→overlay-selected→exported); let drop-off data decide. If ever added: 3 marks max, skippable, once per user.

## Sequencing

| Phase | Items | Verify |
|---|---|---|
| 1 | Ghost+lock-on, rename, manual button, CTA pulse | Browser: select during tracking → ghost → lock-on |
| 2 | Payoff screen, tactility | Export → payoff; tap card → bounce |
| 3 | Smart guides | Drag near center → snap + guide |
| 4 | Carousel, funnel events | Mobile viewport swipe |

Each phase ships independently — browser-verified, typecheck/lint/build, separate commits.

## Non-goals / notes

- `ne` resize handle's `-right-8` offset is intentional (clears rotate handle) — not a bug.
- No licensed-footage implications: all changes are chrome/feedback, not content.
