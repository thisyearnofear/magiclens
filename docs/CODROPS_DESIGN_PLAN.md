# MagicLens × Codrops — Design Refresh Plan

**Status: implemented (all 15 + foundation).** Zero new dependencies — everything is
framer-motion + CSS/SVG/canvas. Verified with `pnpm typecheck`, `pnpm lint`, `pnpm build`
and browser QA on `/`, `/leaderboard`, `/iconic-moments`, `/screening-room`.

New primitives live in `src/components/motion/` (`MotionTrail`, `PixelImage`,
`ElasticColumns`, `ParticleBurst`, `ScrambleText`, `GiantTypeDivider`, `ScrollRotateCard`,
`ScrollHighlight`, `KineticHeader`, `GooeyStrand`, `FlightToLeaderboard`, `WavingFlag`)
plus `src/components/gilt/SeatMap.tsx` and `src/components/PageBackdrop.tsx`.

**Root-cause found during QA:** the "washed-out contrast" was not a card problem — the
ThemeProvider defaulted to `system`, so light-mode users got a white body under
`bg-white/5` cards. The app ships dark-only: `getEffectiveMode` is pinned to `"dark"`
(`src/components/ThemeProvider.tsx`) and `<html>` carries `className="dark"`.

Research: browsed the Codrops hub (`tympanus.net/codrops/hub/all/`, ~25 pages), ran the
top demos live, and read the upstream source (all `github.com/codrops/*`, MIT licensed —
snippets below are real, attributed upstream code).

## Current state — honest rating: ~5.5/10

**Working:** strong motion instincts already in the codebase (`KineticHeroTitle`,
`SeamTransition`, `MagneticButton`, gooey tab pill, `FilmGrain`) and a genuinely good
product loop (Create → Compete → Promote → Screen).

**What's broken:**

1. **Contrast fails in practice.** `from-yellow-400/20 to-purple-400/20` cards over the
   stadium photo render near-white on `/leaderboard` — the "Daily Remix Battle" title is
   unreadable. Same washout on `/iconic-moments`.
2. **One backdrop everywhere.** The same stadium photo + purple gradient sits behind every
   page — muddy, homogenizing, and hostile to text.
3. **Effect soup.** Gooey blobs + film grain + cursor glow + photo + double gradient on
   every screen. Codrops demos do *one* effect per view with total confidence.
4. **Template typography.** One display moment (hero), then plain system sans + gray
   uppercase micro-labels — the generic web3 look.
5. **Layout monoculture.** Every page = header → banner → centered glass-card grid.
6. **Vanity stats.** "6 smart contracts deployed / 2 networks" means nothing to a fan.
7. **First impression fights itself.** Full-screen onboarding wizard + fake "LIVE
   ACTIVITY" ticker overlap the hero on first paint.

**Stack reality:** framer-motion + Tailwind only. GSAP is now fully free (SplitText,
ScrollSmoother, Flip, MotionPath included since the Webflow acquisition), so every demo
below is a legal, cheap port. three.js only where flagged.

---

## Foundation fixes (do first — no new deps)

- [ ] Restrict the stadium photo to the landing hero. App pages get a flat
      `bg-gray-950` (or subtle grid/noise only) — instant contrast + hierarchy win.
- [ ] Replace `bg-gradient-to-r from-yellow-400/20 to-purple-400/20` cards with
      `bg-white/5 border-white/10` (the washout bug above) or give them an opaque base.
- [ ] Pick a type pairing: one display face for headers (e.g. a grotesk/serif — Codrops
      uses Host Grotesk, free SIL license) + a mono face for micro-labels/tx data.
- [ ] Dismiss the live-activity ticker into a page section; delay onboarding wizard
      until after first interaction.
- [ ] Swap vanity stats for user metrics (remixes minted, votes cast, active streaks).

---

## The 15 ideas

Effort: **S** < half day · **M** 1–2 days · **L** multi-day / new dep.

---

### 1. Cursor-following clip reveal on leaderboard rows — S · no deps

Hovering a remix title spawns its video thumbnail that trails the pointer, leans with
its speed, and flips side near viewport edges. Upgrades `LeaderboardHoverReveal`.

Source: `github.com/codrops/InlineHoverReveals` → `js/follow.js` (MIT).

Upstream — the core follow/lean mechanic (GSAP `quickTo` + clamped spot):

```js
const spotFor = (card, point, {offsetX, offsetY}) => {
    const root = document.documentElement;
    const margin = pageMargin();
    const {offsetWidth: width, offsetHeight: height} = card;
    const right = point.x + offsetX + width <= root.clientWidth - margin;
    const below = point.y + offsetY + height <= window.innerHeight - GAP;
    const x = right ? point.x + offsetX : point.x - offsetX - width;
    const y = below ? point.y + offsetY : point.y - offsetY - height;
    return { x: gsap.utils.clamp(margin, root.clientWidth - margin - width, x),
             y: gsap.utils.clamp(GAP, window.innerHeight - GAP - height, y) };
};
// ...in the ticker:
xTo(spot.x); yTo(spot.y);
leanTo(gsap.utils.clamp(-lean, lean, (spot.x - last.x) * 0.5)); // lean with speed
```

React port: `useMotionValue` + `useSpring` on x/y, rotation = `useTransform(vx)`.
Keep the reveal in a `position: fixed` layer outside scroll content, exactly like
upstream's `layerOf()`.

---

### 2. Remix-frame motion trail — S · no deps

Pointer movement spawns a decaying trail of clip frames. Great on the landing hero or
remix studio background — "your edits leave a trail."

Source: `github.com/codrops/MotionTrailAnimations` → `js/trail.js`, `js/demo1/imageTrail.js`.

Upstream — the engine: a lagging trailing position, one image per `threshold` px of
travel, evenly spaced regardless of pointer speed/refresh rate:

```js
// trail.js
const follow = 1 - Math.pow(1 - this.lag, dt);           // frame-rate independent lag
this.trailing.x += (this.pointer.x - this.trailing.x) * follow;
this.trailing.y += (this.pointer.y - this.trailing.y) * follow;
// spawn(): walk from `last` toward the pointer in `threshold` steps
const step = {x: dx / distance * this.threshold, y: dy / distance * this.threshold};
for (let n = 0; distance >= this.threshold && n < this.maxPerFrame; ++n) {
    this.last = {x: this.last.x + step.x, y: this.last.y + step.y};
    distance -= this.threshold;
    this.show(this.last);
}
```

```js
// imageTrail.js — each spawned image slides in from the trail, then shrinks away
img.timeline = gsap.timeline()
  .fromTo(img.DOM.el, {opacity: 1, scale: 1, x: from.x, y: from.y},
                      {duration: 0.4, ease: 'power1', x: to.x, y: to.y}, 0)
  .to(img.DOM.el, {duration: 0.4, ease: 'power3', opacity: 0, scale: 0.2}, 0.4);
```

React port: a ring buffer of ~10 `motion.img` in a fixed layer; a `pointermove`
handler doing the same distance accumulation; `AnimatePresence` or manual springs for
the from→to + shrink-away. Pool = clip thumbnails.

---

### 3. Pixelated media loading — S · no deps

Thumbnails resolve big-pixels → sharp as they enter the viewport. Instant craft feel
in `ClipPicker`, `VideoGallery`, pack thumbnails.

Source: `github.com/codrops/ImagePixelLoading` → `js/content.js` (MIT).

Upstream — downscale-then-upscale on one canvas with smoothing off, stepped through
nonlinear factor values so big blocks linger:

```js
pxFactorValues = [1, 2, 4, 9, 100];
// render():
const size = pxFactor * 0.01;
ctx.imageSmoothingEnabled = size === 1;          // off => pixelated upscale
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(img, 0, 0, w * size, h * size);    // draw tiny
ctx.drawImage(canvas, 0, 0, w * size, h * size,  // blow it back up
                    newX, newY, newWidth, newHeight);
// animatePixels(): step through pxFactorValues, 300ms first then 80ms per step
```

React port: `<PixelImage src>` wrapping a canvas; trigger `animatePixels` on
`useInView`. ~60 lines.

---

### 4. Elastic grid columns — S · no deps (GSAP version available)

Each gallery column scrolls at a slightly different lag — soft, elastic feel on
`IconicMomentsGallery` / `VideoGallery`.

Source: `github.com/codrops/ElasticGridScroll` → `js/demo1/index.js` (MIT).

Upstream — group items into columns, give outer columns more lag via ScrollSmoother
`effects`:

```js
const baseLag = 0.5, lagScale = 0.1;
const mid = (numColumns - 1) / 2;
columns.forEach((column, i) => {
  const lag = baseLag + Math.abs(i - mid) * lagScale;   // center lags least
  // wrap items in .grid__column, then:
  smoother.effects(columnContainer, { speed: 1, lag });
});
```

React port without GSAP: each column is a `motion.div` whose `y` =
`useSpring(useTransform(scrollY, v => -v), { stiffness, damping })` with per-column
stiffness. (The repo also ships a full WebGL version — `js/demo6/ElasticColumns.js`,
columns as stretchy pinned strips with smear + chromatic split — reference if we ever
go shader-deep.)

---

### 5. Particle-burst buttons — S · no deps

Vote and Mint buttons burst with confetti/sparks on click, colored by the active
overlay pack.

Source: `github.com/codrops/ParticleEffectsButtons` → `js/particles.js` (MIT).

Upstream — canvas overlay around the element; particles emitted along a directional
front as it disintegrates:

```js
addParticle(options) {
  this.particles.push({
    startX: options.x, startY: options.y,
    color: color, angle: rand(360),
    increase: Math.PI * 2 / 100,        // sinusoidal wobble per frame
    life: 0,
    death: (frames - 20) + Math.random() * 40,
    speed: speed, size: this.o.size()
  });
}
// renderParticles(): ctx.arc / triangle / rect, globalAlpha = 1 - life/death
```

React port: one `<BurstCanvas>` positioned over the button; on click spawn ~40
particles with random velocity/rotation, fade `1 - life/death`. Alternatively
`canvas-confetti` (3kb) for the lazy version.

---

### 6. Scramble/decrypt on hex strings — S · no deps (DOM fallback)

Hover a tx hash or wallet address → characters scramble then resolve one by one.
Perfect thematic fit for on-chain data.

Source: `github.com/codrops/AnimatedCodeBackground` → `js/fields/decryptField.js` (MIT).
Upstream is a two-pass WebGL field — per-cell "decrypted" state rises near the pointer
and decays elsewhere, each cell locks at its own hash threshold:

```glsl
// state shader, per cell:
float near = uHover * smoothstep(uRadius, uRadius*0.3, distance(uv, uPointer));
decrypted = near > decrypted ? mix(decrypted, near, 1.0 - exp(-uRise*uDt))
                             : max(decrypted - uDecay*uDt, 0.0);
float threshold = 0.15 + 0.75 * hash(vec2(cell) * 1.91 + 3.7);  // scattered lock order
float locked = step(threshold, decrypted);
```

DOM version for us (no WebGL): on `pointerenter`, interval that replaces random
unresolved positions with `0123456789abcdef` noise each tick while locking one more
char per frame in scattered order. ~30 lines, same feel.

---

### 7. Scroll-driven giant type dividers — S · no deps

Micro mono label scales into viewport-filling "REMIX / COMPETE / PREMIERE" with
chromatic edges between landing sections.

Source: `github.com/AntoineW/Codrops-GSAP-Scroll` ("DoNotScroll") + ghost-layer trail.

Upstream — hand-tuned easing + stacked ghost layers trailing the front letter:

```js
const settings = { ghostCount: 6, /* front + 5 colored trail layers */ };
const scaleEase = CustomEase.create('letterScale',
  'M0,0 C0.445,0 0.39,0.583 0.426,0.707 0.457,0.816 0.424,1 1,1');
const moveEase = gsap.parseEase('slow(0.25,0.95,false)');
// ghost layers get staggered trailDelay: 0.0125s each
```

React port: `useScroll({ target: section })` → `scale: useTransform(p, [0,1],[0.05,1])`
on a `text-[40vw]` word; chromatic edge via `text-shadow: 3px 0 #f0f, -3px 0 #0ff` or
two offset copies. Reuse for section breaks on the landing page.

---

### 8. 3D rotate-on-scroll clip cards — S · no deps

Cards tumble in 3D (rotX/rotY/rotZ + depth) as they scroll through the viewport —
`ClipPicker`, `VideoGallery`, pack cards.

Source: `github.com/codrops/RotatingOnScrollAnimations` → `js/index.js` (MIT).

Upstream — mirrored random rotations scrubbed over scroll, with a sine depth dip
midway:

```js
const rotationX = gsap.utils.random(70, 120);
const rotationY = gsap.utils.random(-20, 20);
const rotationZ = gsap.utils.random(-20, 20);
gsap.fromTo(item, {rotationX, rotationY, rotationZ},
                  {rotationX: -rotationX, rotationY: -rotationY, rotationZ: -rotationZ,
   scrollTrigger: {trigger: item, start: 'top bottom+=20%',
                   end: 'bottom top-=20%', scrub: true,
   onUpdate(self){ setZ(Math.sin(self.progress * Math.PI) * -50); }}});
```

React port: `useScroll({ target: ref, offset: ['start end','end start'] })` →
`rotateX/rotateY/z` transforms + parent `perspective-1000`.

---

### 9. On-scroll text highlight — S · no deps

Key phrases in the landing copy ("crowns one Iconic Moment a day") get a marker swipe
or per-char 3D flip as they enter the viewport.

Source: `github.com/codrops/OnScrollTextHighlight` → `js/effect-1/highlightEffect.js` (MIT).

Upstream — per-char rotateX rise on scroll enter (Splitting.js chars + GSAP stagger):

```js
gsap.set(el, { perspective: 500 });
gsap.timeline().fromTo(this.highlightedChars,
  { opacity: 0, z: 300, rotationX: -45 },
  { stagger: 0.04, opacity: 1, z: 0, rotationX: 0, duration: 0.8, ease: 'power2' });
```

React port: split into `<span>` chars, framer-motion `staggerChildren` variant on
`useInView`, or the cheaper marker version — an underline `background-size: 0%→100%`
transition.

---

### 10. Char/word split headers — S · no deps

Extend `KineticHeroTitle`'s treatment to `ProductJourneyHeader` and section titles.

Source: `github.com/codrops/TextCharacterAnimations` — 19 variations. The standout is
`js/variations/swipe.js`: a keyboard-glide trail that writes each word (letters light
up as the stroke passes their keyboard row — digits highest, qwerty → zxcv lowest):

```js
const ROWS = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
heights: [0.95, 0.7, 0.42, 0.14],   // trail height above baseline, in em, per row
// smoothPath(): catmull-rom → cubic bezier through letter positions
```

For us: per-char stagger is free in framer-motion; the swipe concept maps beautifully
onto "GOAL!" moments — a trail sweeping through the word then committing it.

---

### 11. Grid→detail FLIP morph for Iconic Moments — M · no deps (Flip if GSAP)

Clicking a filmstrip frame morphs it into a full editorial detail view; siblings
stagger away. Upgrade of the current `IconicFilmstrip` FLIP modal.

Source: `github.com/codrops/GridToSlider` → `js/demo1/index.js` (MIT).

Upstream — Flip captures grid state, class switches layout, everything animates:

```js
const flipstate = Flip.getState(gridImages);
introGrid.classList.add('intro-grid--slider');          // change layout
gsap.set(introGrid, { yPercent: -100 * current });
Flip.from(flipstate, { duration: 1, ease: 'power4.inOut', absolute: true,
  stagger: { each: 0.02, from: current }, simple: true, prune: true });
```

React port: we already have `layoutId` — the upgrade is making the destination a real
editorial layout (16:9 video + metadata rail + share actions), not just a centered
modal, plus staggered sibling exit.

---

### 12. Sticky nav that melts into media — L · heavy (concept port)

Sticky menu liquid-stretches into pictures it crosses — strands thin, neck, snap back
with a droplet. Extends our gooey motif to `MobileNav`.

Source: `github.com/codrops/GooeyStickyMenu` → `js/strands.js` (MIT). Real strand
physics — damped springs, necking radius curve, snap + recoil droplet:

```js
const SETTINGS = {
  touch: 0.03,      // gap under which a thing and the menu count as touching
  length: 4.2,      // strand length before it snaps (units of menu half-height)
  waist: [0.26, 0.07],  // strand radius mid-way: just formed → about to snap
  breakAt: 0.5, neck: 0.045, bead: 0.1,   // where it thins/snaps + recoil droplet
  tip: [420, 22], settle: [300, 10],      // spring stiffness/damping
};
const step = (s, target, [k, c], dt) => {         // damped spring integrator
  s.v += (-k * (s.x - target) - c * s.v) * dt;
  s.x += s.v * dt;
};
```

Honest assessment: the full effect is ~470 lines of hand-rolled physics + canvas/SDF
drawing. A faithful port is L; a cheap homage (SVG gooey filter strand that stretches
from nav toward a scrolled-past card) is M. Do this only after 1–10.

---

### 13. Thumbnail flow into the leaderboard — M · GSAP MotionPath

When a mint succeeds, its thumbnail flies along a curve into the leaderboard zone —
"entering the battle" made literal.

Source: `github.com/codrops/GridFlowEffect` — thumbnails flow into a grid on load;
same family as the MotionPath thumbnail demo. Core idea:

```js
// upstream pattern: measure start/end rects, animate along a curved path
gsap.to(img, { motionPath: { path: [{x: midX, y: midY}, {x: endX, y: endY}],
               curviness: 1.5 }, duration: 1, ease: 'power2.inOut' });
```

React port without GSAP: animate along an SVG path via `offset-path`/`offset-distance`
(CSS motion path — zero JS) from mint card → leaderboard dock.

---

### 14. Cloth/jersey hero — L · three.js (2D fallback: M)

Fabric pieces drift over giant type, scroll/drag reactive — jerseys and flags are
*the* sports metaphor.

Source: `github.com/twotwentytwo-studio/domgl-cloth` (ClothCarousel) — WebGPU cloth sim.

Fallback: SVG `feTurbulence`+`feDisplacementMap` flag-wave on 2–3 drifting cards, or
CSS `skew`/`rotate` spring on pointer velocity — 60% of the feel, 5% of the cost.
Full cloth only if we adopt three.js anyway (see #15).

---

### 15. Screening Room seat picker — L · three.js (2D version: M)

The daily winner premieres in a cinema: pick a seat → camera flies to it → the remix
plays with light spilling onto the room. Literal product-fit for the Screening Room.

Source: `github.com/codrops/CinemaSeatPreview` (three.js WebGPU + TSL). Even their
seats are hand-built — rounded-box geometry merged per part, cushions folded up on
empty seats, AO baked per-vertex:

```js
// seats.js — a seat is merged RoundedBoxGeometries with baked AO;
// empty seats fold up like a real cinema
const FOLDED = 1.42;
this.fold = Float32Array.from(SEATS, s => (isTaken(s) ? 0 : FOLDED));
```

2D version (M): seat-map SVG → selected seat scales up the video with a
radial-gradient light spill behind it + subtle parallax on the "room". The 3D version
is the eventual flagship — only with three.js.

---

## Suggested order

**Week 1 (quick wins):** #1 reveal, #5 burst, #6 scramble, #9 highlight + foundation
fixes (backdrop, contrast, type pairing).

**Week 2 (identity):** #2 trail, #3 pixel load, #4 elastic columns, #7 giant type,
#8 3D cards, #10 split headers.

**Week 3+ (signature):** #11 FLIP detail, #13 flow-into-board, #15 Screening Room 2D.
Defer #12 and full cloth/3D cinema until a GSAP/three.js decision.

## Dependency note

- Items 1–10: zero new deps (framer-motion + canvas/SVG/CSS).
- Adding `gsap` (+ `lenis`) unlocks faithful ports of everything for ~40kb gzip.
- `three` (+ WebGPU build) only for #14/#15 full versions.
- All `github.com/codrops/*` code is MIT — port freely, keep attribution comments.
