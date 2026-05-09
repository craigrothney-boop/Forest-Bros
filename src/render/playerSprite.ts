import type { PlayerState } from "../game/physics";

export type PlayerDrawPhase =
  | "title"
  | "playing"
  | "gameover"
  | "won";

/** Cropped atlas: 5×4 grid from reference sheet (public/tree-atlas.png). */
export const ATLAS_FRAME_W = 104;
export const ATLAS_FRAME_H = 139;
const ROW_IDLE = 0;
const ROW_RUN = 1;
const ROW_JUMP = 2;
const ROW_DAMAGE = 3;

export function loadPlayerAtlas(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`Failed to load ${img.src}`));
    img.src = `${import.meta.env.BASE_URL}tree-atlas.png`;
  });
}

export interface SpriteSlice {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export function pickPlayerFrame(
  player: PlayerState,
  animTime: number,
  phase: PlayerDrawPhase,
  deathPending: boolean,
): SpriteSlice {
  const sw = ATLAS_FRAME_W;
  const sh = ATLAS_FRAME_H;

  if (deathPending || phase === "gameover") {
    return { sx: 0, sy: ROW_DAMAGE * ATLAS_FRAME_H, sw, sh };
  }

  if (phase === "title" || phase === "won") {
    const f = Math.floor(animTime * 3.2) % 4;
    return { sx: f * ATLAS_FRAME_W, sy: ROW_IDLE * ATLAS_FRAME_H, sw, sh };
  }

  if (!player.grounded) {
    let j = 1;
    if (player.vy < -190) j = 0;
    else if (player.vy > 210) j = 2;
    return { sx: j * ATLAS_FRAME_W, sy: ROW_JUMP * ATLAS_FRAME_H, sw, sh };
  }

  const f = Math.floor(animTime * 11) % 5;
  return { sx: f * ATLAS_FRAME_W, sy: ROW_RUN * ATLAS_FRAME_H, sw, sh };
}
