/**
 * One Euro filter (Casiez et al., CHI 2012) — velocity-adaptive low-pass.
 * Smooth when the signal is slow (kills jitter), responsive when it's fast
 * (no lag). The standard for AR landmark smoothing — see docs/AR_EXPERIENCE_PLAN.md.
 */

export class OneEuroFilter {
  private xPrev: number | null = null;
  private dxPrev = 0;
  private tPrev: number | null = null;

  constructor(
    private minCutoff = 1.0,
    private beta = 0.05,
    private dCutoff = 1.0,
  ) {}

  private alpha(cutoff: number, dt: number): number {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  /** @param x signal value  @param t timestamp in ms */
  filter(x: number, t: number): number {
    if (this.tPrev === null || this.xPrev === null) {
      this.tPrev = t;
      this.xPrev = x;
      return x;
    }
    const dt = Math.max((t - this.tPrev) / 1000, 1e-4);

    const edx = this.alpha(this.dCutoff, dt);
    const dx = (x - this.xPrev) / dt;
    const dxHat = edx * dx + (1 - edx) * this.dxPrev;

    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const ex = this.alpha(cutoff, dt);
    const xHat = ex * x + (1 - ex) * this.xPrev;

    this.tPrev = t;
    this.xPrev = xHat;
    this.dxPrev = dxHat;
    return xHat;
  }

  reset() {
    this.xPrev = null;
    this.tPrev = null;
    this.dxPrev = 0;
  }
}

interface LandmarkLike {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * Filters x/y for every landmark of a MediaPipe pose (33 points).
 * Tuned for normalized [0,1] coordinates — jitter there is tiny, so beta
 * must be larger than for pixel-space signals.
 */
export class PoseSmoother {
  private filters: OneEuroFilter[][];

  constructor(minCutoff = 0.9, beta = 0.08, dCutoff = 1.0, count = 33) {
    this.filters = Array.from({ length: count }, () => [
      new OneEuroFilter(minCutoff, beta, dCutoff),
      new OneEuroFilter(minCutoff, beta, dCutoff),
    ]);
  }

  smooth<T extends LandmarkLike>(landmarks: T[], tMs: number): T[] {
    return landmarks.map((lm, i) => {
      if (i >= this.filters.length) return lm;
      return {
        ...lm,
        x: this.filters[i][0].filter(lm.x, tMs),
        y: this.filters[i][1].filter(lm.y, tMs),
      };
    });
  }

  reset() {
    this.filters.flat().forEach((f) => f.reset());
  }
}
