import type { Pt } from '@/lib/pose-frames';

export interface Emitter {
  pos: Pt;
  /** normalized-units/sec velocity of the source joint */
  vel: Pt;
  /** 0..1 emitter strength (joint visibility) */
  strength: number;
}

export type ParticleStyle = 'confetti' | 'sparkles';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  spin: number;
  shape: 'dot' | 'rect' | 'star';
}

const MAX_PARTICLES = 350;

const CONFETTI_HUES = [45, 25, 350, 145, 210, 280]; // gold, orange, pink, green, blue, purple
const SPARKLE_HUES = [48, 200, 45]; // gold + ice

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Velocity-reactive particle layer for tracked mode. Wrist/ankle speed sets
 * emission rate and launch direction — a celebration wave throws confetti off
 * the hands, a sprint kicks sparkles off the feet. Speed spikes fire a radial
 * burst. Canvas-drawn each rAF by the caller; cheap enough for 60fps.
 */
export class ParticleSystem {
  private particles: Particle[] = [];
  private emitAcc = 0;
  private lastTotalSpeed = 0;
  private burstCooldown = 0;

  constructor(private style: ParticleStyle) {}

  setStyle(style: ParticleStyle) {
    this.style = style;
  }

  reset() {
    this.particles = [];
    this.emitAcc = 0;
    this.lastTotalSpeed = 0;
    this.burstCooldown = 0;
  }

  /**
   * @param emitters live joints this frame
   * @param dt seconds since last update
   * @param frameW/H pixel size of the coordinate space (normalized → px)
   */
  update(emitters: Emitter[], dt: number, frameW: number, frameH: number) {
    const dtClamped = Math.min(dt, 0.1);
    this.burstCooldown = Math.max(0, this.burstCooldown - dtClamped);

    let totalSpeed = 0;
    for (const e of emitters) {
      if (e.strength <= 0.05) continue;
      const speed = Math.hypot(e.vel.x, e.vel.y); // normalized units / sec
      totalSpeed += speed;

      // emission rate ∝ speed — still hands emit nothing, a fist pump sprays
      const rate = Math.min(speed * speed * 14, 90) * e.strength;
      this.emitAcc += rate * dtClamped;
      while (this.emitAcc >= 1 && this.particles.length < MAX_PARTICLES) {
        this.emitAcc -= 1;
        this.spawn(
          e.pos.x * frameW,
          e.pos.y * frameH,
          e.vel.x * frameW * rand(0.35, 0.65) + rand(-40, 40),
          e.vel.y * frameH * rand(0.35, 0.65) + rand(-60, -10),
        );
      }
    }

    // Celebration spike — total speed jumps past the threshold → radial burst
    if (totalSpeed > 1.6 && totalSpeed - this.lastTotalSpeed > 0.8 && this.burstCooldown <= 0) {
      this.burstCooldown = 0.9;
      const lead = emitters.reduce((a, b) => (a.strength > b.strength ? a : b));
      const cx = lead.pos.x * frameW;
      const cy = lead.pos.y * frameH;
      for (let i = 0; i < 42; i++) {
        const ang = (i / 42) * Math.PI * 2 + rand(-0.1, 0.1);
        const spd = rand(140, 420);
        this.spawn(cx, cy, Math.cos(ang) * spd, Math.sin(ang) * spd - 80);
      }
    }
    this.lastTotalSpeed = this.lastTotalSpeed * 0.7 + totalSpeed * 0.3;

    const gravity = this.style === 'confetti' ? 500 : 60;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dtClamped;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += gravity * dtClamped;
      p.vx *= 1 - 0.9 * dtClamped;
      p.x += p.vx * dtClamped;
      p.y += p.vy * dtClamped;
      p.spin += dtClamped * 6;
    }
  }

  private spawn(x: number, y: number, vx: number, vy: number) {
    const hues = this.style === 'confetti' ? CONFETTI_HUES : SPARKLE_HUES;
    this.particles.push({
      x: x + rand(-6, 6),
      y: y + rand(-6, 6),
      vx,
      vy,
      life: rand(0.45, this.style === 'confetti' ? 1.4 : 0.8),
      maxLife: 1.4,
      size: rand(2, this.style === 'confetti' ? 6 : 3.5),
      hue: hues[(Math.random() * hues.length) | 0],
      spin: rand(0, Math.PI * 2),
      shape: this.style === 'confetti' ? 'rect' : Math.random() < 0.4 ? 'star' : 'dot',
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalCompositeOperation = this.style === 'sparkles' ? 'lighter' : 'source-over';
    for (const p of this.particles) {
      const a = Math.min(1, (p.life / p.maxLife) * 2.2);
      ctx.fillStyle = `hsla(${p.hue}, 95%, ${this.style === 'sparkles' ? 72 : 58}%, ${a})`;
      if (p.shape === 'rect') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        ctx.restore();
      } else if (p.shape === 'star') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.lineTo(0, -p.size);
          ctx.rotate(Math.PI / 2);
          ctx.lineTo(0, -p.size * 0.35);
          ctx.rotate(Math.PI / 2);
        }
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
