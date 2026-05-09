import { STORAGE_MUTE, STORAGE_MUSIC_OFF } from "./constants";

let ctx: AudioContext | null = null;
let musicGain: GainNode | null = null;
const musicOscs: OscillatorNode[] = [];

function getCtx(): AudioContext | null {
  if (typeof AudioContext === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function masterMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_MUTE) === "1";
  } catch {
    return false;
  }
}

function musicUserOff(): boolean {
  try {
    return localStorage.getItem(STORAGE_MUSIC_OFF) === "1";
  } catch {
    return false;
  }
}

export async function resumeAudio(): Promise<void> {
  const c = getCtx();
  if (c?.state === "suspended") await c.resume();
}

/** Soft procedural pad — no external samples (easy to ship on Pages). */
export function ensureBackgroundMusic(): void {
  const c = getCtx();
  if (!c || musicGain) return;

  musicGain = c.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(c.destination);

  const freqs = [110, 164.81, 196];
  const gains = [0.012, 0.008, 0.007];
  for (let i = 0; i < freqs.length; i++) {
    const o = c.createOscillator();
    o.type = i === 0 ? "triangle" : "sine";
    o.frequency.value = freqs[i];
    const g = c.createGain();
    g.gain.value = gains[i] ?? 0.01;
    o.connect(g);
    g.connect(musicGain);
    o.start();
    musicOscs.push(o);
  }

  applyMusicVolume();
}

export function stopBackgroundMusic(): void {
  for (const o of musicOscs) {
    try {
      o.stop();
      o.disconnect();
    } catch {
      /* already stopped */
    }
  }
  musicOscs.length = 0;
  if (musicGain) {
    try {
      musicGain.disconnect();
    } catch {
      /* ignore */
    }
  }
  musicGain = null;
}

export function applyMusicVolume(): void {
  const c = getCtx();
  if (!c || !musicGain) return;
  const off = masterMuted() || musicUserOff();
  const target = off ? 0 : 0.65;
  const t = c.currentTime;
  musicGain.gain.cancelScheduledValues(t);
  musicGain.gain.setValueAtTime(musicGain.gain.value, t);
  musicGain.gain.linearRampToValueAtTime(target, t + 0.4);
}

function beep(freq: number, duration: number, gain: number): void {
  if (masterMuted()) return;
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + duration);
}

export function playJumpSound(): void {
  beep(520, 0.06, 0.04);
}

export function playFailSound(): void {
  beep(180, 0.12, 0.06);
}

export function playWinSound(): void {
  beep(660, 0.08, 0.05);
  setTimeout(() => beep(880, 0.1, 0.045), 90);
}
