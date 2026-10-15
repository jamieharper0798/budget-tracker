import confetti from 'canvas-confetti';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, duration: number, volume = 0.18, type: OscillatorType = 'sine') {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

// Pentatonic so a run of check-ins climbs pleasantly instead of clashing.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];

export const sounds = {
  tick(step = 0) {
    tone(SCALE[step % SCALE.length], 0, 0.12, 0.08, 'triangle');
  },
  complete(combo = 0) {
    const base = SCALE[Math.min(combo, SCALE.length - 2)];
    tone(base, 0, 0.18, 0.16, 'triangle');
    tone(base * 1.5, 0.07, 0.28, 0.12, 'sine');
  },
  undo() {
    tone(392, 0, 0.1, 0.06, 'sine');
    tone(330, 0.06, 0.12, 0.05, 'sine');
  },
  fanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.4, 0.14, 'triangle'));
    tone(1318.51, 0.38, 0.7, 0.1, 'sine');
  },
};

export function haptic(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

export function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function burstAt(x: number, y: number, colors: string[]) {
  if (reducedMotion()) return;
  confetti({
    particleCount: 36,
    spread: 70,
    startVelocity: 28,
    gravity: 0.9,
    ticks: 120,
    scalar: 0.8,
    origin: { x: x / window.innerWidth, y: y / window.innerHeight },
    colors,
    disableForReducedMotion: true,
  });
}

export function celebrate() {
  if (reducedMotion()) return;
  const colors = ['#f472b6', '#a855f7', '#fb923c', '#facc15', '#2dd4bf'];
  const end = Date.now() + 900;
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors });
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.45 }, colors, scalar: 1.1 });
}
