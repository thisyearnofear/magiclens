'use client';

import { useCallback, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  life: number;
  death: number;
  size: number;
  color: string;
  shape: 'circle' | 'rect' | 'triangle';
}

const DEFAULT_COLORS = ['#facc15', '#fde047', '#a855f7', '#3b82f6', '#22c55e'];

/**
 * Codrops ParticleEffectsButtons-inspired canvas burst.
 * Call burst(x, y) inside a click handler — particles fly from that point,
 * wobble sinusoidally, and die out. One fixed canvas layer per layer mount.
 */
export function useParticleBurst() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef(0);

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.current = particles.current.filter((p) => p.life < p.death);
    for (const p of particles.current) {
      p.life += 1;
      p.vy += 0.22; // gravity
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy + Math.sin(p.life * p.vr * 0.4) * 1.4; // sinus wobble
      p.rot += p.vr;

      const fade = 1 - p.life / p.death;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(fade, 0);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(0, -p.size / 2);
        ctx.lineTo(p.size / 2, p.size / 2);
        ctx.lineTo(-p.size / 2, p.size / 2);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }
      ctx.restore();
    }

    if (particles.current.length > 0) {
      raf.current = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const burst = useCallback(
    (x: number, y: number, colors: string[] = DEFAULT_COLORS, count = 28) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const shapes: Particle['shape'][] = ['circle', 'rect', 'triangle'];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 7;
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3.5,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.3,
          life: 0,
          death: 45 + Math.random() * 45,
          size: 3 + Math.random() * 7,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        });
      }
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(tick);
    },
    [tick]
  );

  const layer = (
    <canvas
      ref={(el) => {
        canvasRef.current = el;
        if (el) {
          el.width = window.innerWidth;
          el.height = window.innerHeight;
        }
      }}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[95] h-full w-full"
    />
  );

  return { burst, layer };
}
