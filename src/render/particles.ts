import type { BiomeId } from "../world/types";
import { BIOMES } from "../world/biomes";
import { CANVAS_W, GROUND_Y } from "../game/constants";

export type ParticleKind = "leaf" | "dust";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  kind: ParticleKind;
  size: number;
  rot: number;
  vr: number;
  color: string;
}

function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

/** Screen-space dust at foot landing. */
export function spawnDustBurst(px: number, py: number): Particle[] {
  const out: Particle[] = [];
  const n = 8 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) {
    const a = rand(-Math.PI * 0.35, Math.PI * 0.1);
    const sp = rand(40, 120);
    out.push({
      x: px + rand(-6, 6),
      y: py + rand(-4, 2),
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - rand(0, 40),
      life: 1,
      maxLife: rand(0.28, 0.45),
      kind: "dust",
      size: rand(2, 5),
      rot: rand(0, Math.PI * 2),
      vr: rand(-4, 4),
      color: `rgba(255,255,255,${rand(0.25, 0.55)})`,
    });
  }
  return out;
}

export function spawnAmbientLeaf(biome: BiomeId): Particle | null {
  if (Math.random() > 0.32) return null;
  const p = BIOMES[biome];
  return {
    x: CANVAS_W + rand(10, 80),
    y: rand(40, GROUND_Y - 70),
    vx: rand(-55, -22),
    vy: rand(-14, 18),
    life: 1,
    maxLife: rand(2.4, 4.5),
    kind: "leaf",
    size: rand(5, 10),
    rot: rand(0, Math.PI * 2),
    vr: rand(-1.2, 1.2),
    color: p.parallaxNear,
  };
}

export function updateParticles(parts: Particle[], dt: number, biome: BiomeId): void {
  const g = 120;
  for (let i = parts.length - 1; i >= 0; i--) {
    const q = parts[i];
    q.life -= dt / q.maxLife;
    if (q.life <= 0) {
      parts.splice(i, 1);
      continue;
    }
    q.vy += g * dt * (q.kind === "dust" ? 0.35 : 0.08);
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.rot += q.vr * dt;
    if (q.kind === "leaf" && (q.x < -40 || q.y > GROUND_Y + 30)) {
      parts.splice(i, 1);
    }
  }
  const leaf = spawnAmbientLeaf(biome);
  if (leaf) parts.push(leaf);
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  parts: Particle[],
): void {
  for (const q of parts) {
    if (q.x < -40 || q.x > CANVAS_W + 40) continue;
    const a = Math.max(0, q.life);
    ctx.save();
    ctx.translate(q.x, q.y);
    ctx.rotate(q.rot);
    ctx.globalAlpha = a * (q.kind === "dust" ? 0.85 : 0.65);
    if (q.kind === "dust") {
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, q.size, q.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = q.color;
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -q.size * 0.6);
      ctx.quadraticCurveTo(q.size * 0.7, 0, 0, q.size * 0.5);
      ctx.quadraticCurveTo(-q.size * 0.7, 0, 0, -q.size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
