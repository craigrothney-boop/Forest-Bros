export const CANVAS_W = 960;
export const CANVAS_H = 540;

export const PLAYER_SCREEN_X = 220;
export const PLAYER_W = 40;
export const PLAYER_H = 46;

/** Ground surface y (top of floor). */
export const GROUND_Y = 460;

export const GRAVITY = 2520;
export const JUMP_VELOCITY = -652;
export const COYOTE_MS = 98;
export const JUMP_BUFFER_MS = 128;

export const BASE_SPEED = 292;
/** Caps combined segment multiplier after ramping. */
export const MAX_SPEED_MUL = 1.3;
/** Ease into each segment’s target speed over this world distance (px). */
export const SEGMENT_RAMP_DIST = 520;
export const SEGMENT_RAMP_MIN_FRAC = 0.74;

export const RUNWAY_END = 340;

export const DEATH_FALL_Y = 640;
/** Brief invulnerability after a new run (spikes / crush only; pits still dangerous). */
export const INVINCIBILITY_MS = 2200;
/** Hold the last frame before showing game over (readability). */
export const DEATH_FREEZE_S = 0.5;

export const STORAGE_BEST = "forest-bros-best";
export const STORAGE_MUTE = "forest-bros-muted";
export const STORAGE_MUSIC_OFF = "forest-bros-music-off";
export const STORAGE_REDUCE_MOTION = "forest-bros-reduce-motion";
