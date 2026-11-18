import { isSoundEnabled } from '@/components/FerroSoundToggle';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function blip(freq: number, dur: number, gain = 0.07, type: OscillatorType = 'sine') {
  if (!isSoundEnabled()) return;
  const c = audio();
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  } catch {}
}

/** Short tick on overlay select */
export const playTick = () => blip(880, 0.11);
/** Lower tick on deselect */
export const playUntick = () => blip(520, 0.1);
/** Two-note chime on successful export */
export const playSuccess = () => {
  blip(660, 0.14);
  setTimeout(() => blip(990, 0.2), 110);
};
