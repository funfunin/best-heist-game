// audio.js — tiny WebAudio synth: no audio files, every sound is a few
// oscillator blips. Created lazily on the first user gesture so browsers
// allow it.

let ctx = null;
let muted = false;

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() { audioCtx(); }
export function toggleMute() { muted = !muted; return muted; }

function blip(freq, dur, type, vol, when = 0, slideTo = null) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sfx = {
  // Soft footstep tick while moving (throttled by the caller).
  step() { blip(190, 0.05, 'sine', 0.03); },
  // Bright coin pickup.
  coin() { blip(880, 0.09, 'triangle', 0.12); blip(1320, 0.12, 'triangle', 0.10, 0.07); },
  // The Velvet Star: a little arpeggio.
  gem() {
    blip(523, 0.12, 'triangle', 0.14);
    blip(659, 0.12, 'triangle', 0.14, 0.09);
    blip(784, 0.2, 'triangle', 0.16, 0.18);
  },
  // Alarm tick while spotted (rate-limited by the caller).
  spotted() { blip(660, 0.08, 'square', 0.05, 0, 440); },
  // Noisemaker clatter.
  clatter() { blip(300, 0.06, 'square', 0.08); blip(210, 0.08, 'square', 0.07, 0.05); },
  // Smoke puff.
  puff() { blip(400, 0.25, 'sine', 0.06, 0, 120); },
  // Lockpick click, then the vent door sliding open.
  pick() { blip(1200, 0.04, 'square', 0.05); },
  ventOpen() { blip(180, 0.5, 'sawtooth', 0.05, 0, 90); },
  // Caught: a low two-note sting.
  caught() { blip(220, 0.35, 'sawtooth', 0.12, 0, 110); blip(165, 0.5, 'sawtooth', 0.12, 0.25, 82); },
  // Getaway: a rising win phrase.
  win() {
    [523, 659, 784, 1046].forEach((f, i) => blip(f, 0.18, 'triangle', 0.13, i * 0.11));
  },
};
