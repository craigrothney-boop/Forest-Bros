import { rectsOverlap, rectBottom, type Rect } from "../math";
import {
  COYOTE_MS,
  DEATH_FALL_Y,
  GROUND_Y,
  GRAVITY,
  JUMP_BUFFER_MS,
  JUMP_VELOCITY,
  PLAYER_H,
  PLAYER_SCREEN_X,
  PLAYER_W,
} from "./constants";
import type { BuiltLevel } from "../world/types";

export interface PlayerState {
  y: number;
  vy: number;
  grounded: boolean;
  coyoteMs: number;
  jumpBufferMs: number;
  squash: number;
}

export function createPlayer(): PlayerState {
  return {
    y: GROUND_Y - PLAYER_H,
    vy: 0,
    grounded: true,
    coyoteMs: 0,
    jumpBufferMs: 0,
    squash: 1,
  };
}

function footCenterWorldX(scroll: number): number {
  return scroll + PLAYER_SCREEN_X + PLAYER_W * 0.5;
}

function isOverVoid(worldX: number, voids: BuiltLevel["voids"]): boolean {
  for (const v of voids) {
    if (worldX >= v.x0 && worldX <= v.x1) return true;
  }
  return false;
}

function playerWorldRect(scroll: number, player: PlayerState): Rect {
  return {
    x: scroll + PLAYER_SCREEN_X,
    y: player.y,
    w: PLAYER_W,
    h: PLAYER_H,
  };
}

export function stepPlayer(
  dt: number,
  scroll: number,
  player: PlayerState,
  level: BuiltLevel,
  jumpPressed: boolean,
): { status: "alive" | "dead"; didJump: boolean } {
  let didJump = false;
  if (jumpPressed) player.jumpBufferMs = JUMP_BUFFER_MS;
  else player.jumpBufferMs = Math.max(0, player.jumpBufferMs - dt * 1000);

  if (player.grounded) player.coyoteMs = COYOTE_MS;
  else player.coyoteMs = Math.max(0, player.coyoteMs - dt * 1000);

  const canJump = player.grounded || player.coyoteMs > 0;
  if (player.jumpBufferMs > 0 && canJump) {
    player.vy = JUMP_VELOCITY;
    player.jumpBufferMs = 0;
    player.coyoteMs = 0;
    player.grounded = false;
    didJump = true;
  }

  const prevY = player.y;
  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;

  // Squash/stretch visual helper
  const targetSquash = clamp(1 + player.vy * 0.00035, 0.88, 1.12);
  player.squash += (targetSquash - player.squash) * Math.min(1, dt * 12);

  const footX = footCenterWorldX(scroll);
  const overVoid = isOverVoid(footX, level.voids);

  const pw = playerWorldRect(scroll, player);

  // Solids
  let groundedHere = false;
  for (const s of level.solids) {
    if (!rectsOverlap(pw, s)) continue;
    const wasAbove = rectBottom({ ...pw, y: prevY }) <= s.y + 8;
    if (player.vy >= 0 && wasAbove) {
      player.y = s.y - PLAYER_H;
      player.vy = 0;
      groundedHere = true;
    } else if (player.vy < 0 && prevY >= s.y + s.h - 8) {
      player.y = s.y + s.h;
      player.vy = 0;
    } else {
      return { status: "dead", didJump };
    }
  }

  const pw2 = playerWorldRect(scroll, player);

  // Default ground
  if (
    !groundedHere &&
    !overVoid &&
    rectBottom(pw2) >= GROUND_Y &&
    player.vy >= 0
  ) {
    player.y = GROUND_Y - PLAYER_H;
    player.vy = 0;
    groundedHere = true;
  }

  player.grounded = groundedHere;

  // Hazards
  const pwFinal = playerWorldRect(scroll, player);
  for (const h of level.hazards) {
    if (rectsOverlap(pwFinal, h)) return { status: "dead", didJump };
  }

  if (player.y > DEATH_FALL_Y) return { status: "dead", didJump };

  return { status: "alive", didJump };
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}
