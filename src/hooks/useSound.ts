'use client';

/**
 * Lightweight sound hook for MagicLens audio feedback.
 * Uses Web Audio API oscillator (no external files needed).
 * All sounds are subtle, tasteful, and disabled by default.
 */

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.08,
  rampDown = true,
) {
  const ctx = getContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  if (rampDown) {
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function useSound() {
  const play = {
    /** Soft click for buttons, tabs, toggles */
    click: () => playTone(800, 0.06, 'sine', 0.05),

    /** Rising "whoosh" for page transitions */
    whoosh: () => {
      const ctx = getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    },

    /** Celebratory chime for mint complete, promotion, achievement */
    celebrate: () => {
      playTone(523, 0.15, 'sine', 0.06);   // C5
      setTimeout(() => playTone(659, 0.15, 'sine', 0.06), 100); // E5
      setTimeout(() => playTone(784, 0.3, 'sine', 0.06), 200);  // G5
    },

    /** Success notification ping */
    success: () => {
      playTone(1047, 0.08, 'sine', 0.05); // C6
      setTimeout(() => playTone(1319, 0.12, 'sine', 0.05), 60); // E6
    },

    /** Error buzz */
    error: () => playTone(150, 0.3, 'sawtooth', 0.04),

    /** Vote cast — short pop */
    vote: () => playTone(600, 0.05, 'triangle', 0.06),

    /** Stadium ambient — low hum (call once, loop briefly) */
    ambient: (duration = 3000) => {
      const ctx = getContext();
      if (!ctx || typeof window === 'undefined') return;
      const bufferSize = ctx.sampleRate * (duration / 1000);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Brown noise — lower, more "stadium rumble" feel
        data[i] = (Math.random() * 2 - 1) * 0.02;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    },
  };

  return play;
}
