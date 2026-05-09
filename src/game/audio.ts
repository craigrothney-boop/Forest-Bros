let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof AudioContext === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export async function resumeAudio(): Promise<void> {
  const c = getCtx();
  if (c?.state === "suspended") await c.resume();
}

function beep(freq: number, duration: number, gain: number): void {
  if (typeof localStorage !== "undefined" && localStorage.getItem("forest-bros-muted") === "1") return;
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
