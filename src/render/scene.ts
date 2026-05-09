import { BIOMES, biomeAtX } from "../world/biomes";
import type { BiomeId } from "../world/types";
import type { BuiltLevel } from "../world/types";
import {
  CANVAS_H,
  CANVAS_W,
  GROUND_Y,
  PLAYER_H,
  PLAYER_SCREEN_X,
  PLAYER_W,
} from "../game/constants";
import type { PlayerState } from "../game/physics";

function worldToScreen(worldX: number, scroll: number): number {
  return worldX - scroll;
}

export function drawParallax(
  ctx: CanvasRenderingContext2D,
  scroll: number,
  biome: BiomeId,
): void {
  const p = BIOMES[biome];
  const t = scroll * 0.08;
  const t2 = scroll * 0.15;
  const t3 = scroll * 0.28;

  ctx.fillStyle = p.parallaxFar;
  for (let i = -1; i < 8; i++) {
    const x = i * 220 - (t % 220);
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y - 40);
    ctx.lineTo(x + 80, GROUND_Y - 120);
    ctx.lineTo(x + 160, GROUND_Y - 50);
    ctx.lineTo(x + 220, GROUND_Y - 40);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = p.parallaxMid;
  for (let i = -1; i < 10; i++) {
    const x = i * 180 - (t2 % 180);
    ctx.fillRect(x, GROUND_Y - 70, 90, 70);
  }

  ctx.fillStyle = p.parallaxNear;
  for (let i = -1; i < 12; i++) {
    const x = i * 140 - (t3 % 140);
    ctx.beginPath();
    ctx.roundRect(x, GROUND_Y - 95, 36, 95, 6);
    ctx.fill();
  }
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  scroll: number,
  segmentMeta: BuiltLevel["segments"],
): void {
  const wx = scroll + CANVAS_W * 0.35;
  const biome = biomeAtX(segmentMeta, wx);
  const p = BIOMES[biome];

  const grd = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grd.addColorStop(0, p.skyTop);
  grd.addColorStop(1, p.skyBottom);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawParallax(ctx, scroll, biome);
}

export function drawGroundAndPits(
  ctx: CanvasRenderingContext2D,
  scroll: number,
  level: BuiltLevel,
  biome: BiomeId,
): void {
  const p = BIOMES[biome];
  const pad = 80;
  const view0 = scroll - pad;
  const view1 = scroll + CANVAS_W + pad;

  ctx.fillStyle = p.ground;
  ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

  ctx.strokeStyle = p.groundLine;
  ctx.lineWidth = 4;
  ctx.beginPath();
  let drawing = false;
  const step = 16;
  for (let sx = 0; sx <= CANVAS_W; sx += step) {
    const worldX = scroll + sx;
    let inVoid = false;
    for (const v of level.voids) {
      if (worldX >= v.x0 && worldX <= v.x1) {
        inVoid = true;
        break;
      }
    }
    const sy = GROUND_Y;
    if (!inVoid) {
      if (!drawing) {
        ctx.moveTo(sx, sy);
        drawing = true;
      } else ctx.lineTo(sx, sy);
    } else {
      drawing = false;
    }
  }
  ctx.stroke();

  // Pit interiors (visible voids)
  ctx.fillStyle = p.skyBottom;
  for (const v of level.voids) {
    if (v.x1 < view0 || v.x0 > view1) continue;
    const x0 = Math.max(0, worldToScreen(v.x0, scroll));
    const x1 = Math.min(CANVAS_W, worldToScreen(v.x1, scroll));
    if (x1 > x0) ctx.fillRect(x0, GROUND_Y - 2, x1 - x0, CANVAS_H - GROUND_Y + 2);
  }

  // Side shade in pits
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  for (const v of level.voids) {
    if (v.x1 < view0 || v.x0 > view1) continue;
    const x0 = Math.max(0, worldToScreen(v.x0, scroll));
    const x1 = Math.min(CANVAS_W, worldToScreen(v.x1, scroll));
    if (x1 > x0) ctx.fillRect(x0, GROUND_Y + 8, Math.min(14, x1 - x0), CANVAS_H);
  }
}

export function drawSolids(
  ctx: CanvasRenderingContext2D,
  scroll: number,
  level: BuiltLevel,
  biome: BiomeId,
): void {
  const p = BIOMES[biome];
  const pad = 60;
  const view0 = scroll - pad;
  const view1 = scroll + CANVAS_W + pad;

  for (const s of level.solids) {
    if (s.x + s.w < view0 || s.x > view1) continue;
    const sx = worldToScreen(s.x, scroll);
    ctx.fillStyle = p.accent;
    ctx.strokeStyle = p.groundLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(sx, s.y, s.w, s.h, 6);
    ctx.fill();
    ctx.stroke();
  }
}

export function drawHazards(
  ctx: CanvasRenderingContext2D,
  scroll: number,
  level: BuiltLevel,
  biome: BiomeId,
): void {
  const p = BIOMES[biome];
  const pad = 60;
  const view0 = scroll - pad;
  const view1 = scroll + CANVAS_W + pad;

  for (const h of level.hazards) {
    if (h.x + h.w < view0 || h.x > view1) continue;
    const sx = worldToScreen(h.x, scroll);
    ctx.fillStyle = p.hazard;
    ctx.beginPath();
    ctx.moveTo(sx, h.y + h.h);
    ctx.lineTo(sx + h.w * 0.5, h.y);
    ctx.lineTo(sx + h.w, h.y + h.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  biome: BiomeId,
  invincibleFlash: boolean,
): void {
  const palette = BIOMES[biome];
  const cx = PLAYER_SCREEN_X + PLAYER_W * 0.5;
  const baseY = player.y + PLAYER_H;
  ctx.save();
  if (invincibleFlash) ctx.globalAlpha = 0.5;
  ctx.translate(cx, baseY);
  ctx.scale(1, player.squash);
  ctx.translate(-cx, -baseY);

  const x = PLAYER_SCREEN_X;
  const y = player.y;
  const w = PLAYER_W;
  const h = PLAYER_H;

  // Roots
  ctx.strokeStyle = "#5d4037";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const ox = x + 8 + i * 12;
    ctx.beginPath();
    ctx.moveTo(ox, y + h - 4);
    ctx.quadraticCurveTo(ox - 6, y + h + 10, ox - 10, y + h + 4);
    ctx.stroke();
  }

  // Stump body
  ctx.fillStyle = "#6d4c41";
  ctx.strokeStyle = "#3e2723";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 18, w - 8, h - 22, 10);
  ctx.fill();
  ctx.stroke();

  // Leaves / canopy
  ctx.fillStyle = palette.parallaxNear;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + 16, w * 0.55, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1b5e20";
  ctx.stroke();

  // Face
  ctx.fillStyle = "#fffde7";
  ctx.beginPath();
  ctx.arc(x + w * 0.35, y + 32, 4, 0, Math.PI * 2);
  ctx.arc(x + w * 0.65, y + 32, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(x + w * 0.35, y + 32, 2, 0, Math.PI * 2);
  ctx.arc(x + w * 0.65, y + 32, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawFinishRibbon(
  ctx: CanvasRenderingContext2D,
  scroll: number,
  endX: number,
): void {
  const sx = worldToScreen(endX, scroll);
  if (sx < -40 || sx > CANVAS_W + 40) return;
  ctx.fillStyle = "rgba(255, 213, 79, 0.9)";
  ctx.strokeStyle = "#f57f17";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(sx - 8, 80, 36, 200, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#5d4037";
  ctx.font = "bold 14px system-ui,sans-serif";
  ctx.save();
  ctx.translate(sx + 10, 200);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Home!", -40, 0);
  ctx.restore();
}
