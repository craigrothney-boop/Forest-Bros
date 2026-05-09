import {
  BASE_SPEED,
  CANVAS_H,
  CANVAS_W,
  DEATH_FREEZE_S,
  GROUND_Y,
  INVINCIBILITY_MS,
  MAX_SPEED_MUL,
  PLAYER_SCREEN_X,
  PLAYER_W,
  RUNWAY_END,
  SEGMENT_RAMP_DIST,
  SEGMENT_RAMP_MIN_FRAC,
  STORAGE_BEST,
  STORAGE_MUTE,
  STORAGE_MUSIC_OFF,
  STORAGE_REDUCE_MOTION,
} from "./constants";
import { InputBuffer } from "./input";
import { createPlayer, stepPlayer, type PlayerState } from "./physics";
import type { BiomeId, BuiltLevel } from "../world/types";
import { BIOMES, biomeAtX } from "../world/biomes";
import {
  drawBackground,
  drawFinishRibbon,
  drawGroundAndPits,
  drawHazards,
  drawPlayer,
  drawSolids,
} from "../render/scene";
import {
  drawParticles,
  spawnDustBurst,
  updateParticles,
  type Particle,
} from "../render/particles";
import { BIOME_TOAST } from "./story";
import * as audio from "./audio";

const FIXED_DT = 1 / 60;
const MAX_STEPS = 6;

export type Phase = "title" | "playing" | "gameover" | "won";

function effectiveSpeedMul(
  footX: number,
  segments: BuiltLevel["segments"],
): number {
  const first = segments[0];
  if (first && footX < first.x0) {
    const rampLen = Math.max(160, first.x0 - RUNWAY_END * 0.5);
    const u = Math.min(1, Math.max(0, (footX - RUNWAY_END * 0.2) / rampLen));
    const smooth = u * u * (3 - 2 * u);
    const ramp =
      SEGMENT_RAMP_MIN_FRAC + (1 - SEGMENT_RAMP_MIN_FRAC) * smooth;
    return Math.min(MAX_SPEED_MUL, first.speedMul * ramp);
  }
  for (const s of segments) {
    if (footX >= s.x0 && footX < s.x1) {
      const u = Math.min(
        1,
        Math.max(0, (footX - s.x0) / SEGMENT_RAMP_DIST),
      );
      const smooth = u * u * (3 - 2 * u);
      const ramp =
        SEGMENT_RAMP_MIN_FRAC + (1 - SEGMENT_RAMP_MIN_FRAC) * smooth;
      return Math.min(MAX_SPEED_MUL, s.speedMul * ramp);
    }
  }
  const last = segments[segments.length - 1]?.speedMul ?? 1;
  return Math.min(MAX_SPEED_MUL, last);
}

function loadBool(key: string, defaultVal: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return defaultVal;
    return v === "1";
  } catch {
    return defaultVal;
  }
}

function saveBool(key: string, val: boolean): void {
  try {
    localStorage.setItem(key, val ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function loadInt(key: string, defaultVal: number): number {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return defaultVal;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : defaultVal;
  } catch {
    return defaultVal;
  }
}

function saveInt(key: string, val: number): void {
  try {
    localStorage.setItem(key, String(Math.floor(val)));
  } catch {
    /* ignore */
  }
}

export class Game {
  private readonly ctx: CanvasRenderingContext2D;
  readonly input: InputBuffer;
  level: BuiltLevel;
  player: PlayerState;
  phase: Phase = "title";
  scroll = 0;
  runBest = 0;
  runMaxScroll = 0;
  shake = 0;
  muted: boolean;
  musicOff: boolean;
  reduceMotion: boolean;
  invincibleMs = 0;
  private deathPending = false;
  private deathTimer = 0;
  private prevBiome: BiomeId | null = null;
  private toastText = "";
  private toastT = 0;
  private particles: Particle[] = [];
  private accum = 0;
  private raf = 0;
  private lastFrameT = 0;
  private hudEl: HTMLElement;
  private onKey = (e: KeyboardEvent): void => {
    if (e.key === "m" || e.key === "M") {
      this.muted = !this.muted;
      saveBool(STORAGE_MUTE, this.muted);
      audio.applyMusicVolume();
      this.syncHud();
    }
    if (e.key === "b" || e.key === "B") {
      this.musicOff = !this.musicOff;
      saveBool(STORAGE_MUSIC_OFF, this.musicOff);
      audio.applyMusicVolume();
      this.syncHud();
    }
    if (e.key === "r" || e.key === "R") {
      this.reduceMotion = !this.reduceMotion;
      saveBool(STORAGE_REDUCE_MOTION, this.reduceMotion);
      this.syncHud();
    }
  };

  constructor(
    readonly canvas: HTMLCanvasElement,
    level: BuiltLevel,
    hudEl: HTMLElement,
  ) {
    const c = canvas.getContext("2d");
    if (!c) throw new Error("2d context");
    this.ctx = c;
    this.level = level;
    this.player = createPlayer();
    this.input = new InputBuffer(canvas);
    this.hudEl = hudEl;
    this.runBest = loadInt(STORAGE_BEST, 0);
    this.muted = loadBool(STORAGE_MUTE, false);
    this.musicOff = loadBool(STORAGE_MUSIC_OFF, false);
    this.reduceMotion = loadBool(STORAGE_REDUCE_MOTION, false);
    this.syncHud();
    window.addEventListener("keydown", this.onKey);
  }

  start(): void {
    const loop = (t: number) => {
      const last = this.lastFrameT || t;
      this.lastFrameT = t;
      const dt = Math.min(0.05, (t - last) / 1000);
      this.frame(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKey);
    this.input.dispose();
    audio.stopBackgroundMusic();
  }

  private syncHud(): void {
    const lines: string[] = [];
    lines.push(
      `<strong>Forest Bros</strong> — a little tree looking for a new home.`,
    );
    lines.push(
      `Best run: <strong>${this.runBest}m</strong> · <kbd>Space</kbd> / tap jump · <kbd>M</kbd> mute all · <kbd>B</kbd> music · <kbd>R</kbd> reduce motion`,
    );
    this.hudEl.innerHTML = lines.join("<br/>");
  }

  private frame(dt: number): void {
    this.accum += dt;
    let steps = 0;
    while (this.accum >= FIXED_DT && steps < MAX_STEPS) {
      this.fixedStep(FIXED_DT);
      this.accum -= FIXED_DT;
      steps++;
    }
    if (steps === MAX_STEPS) this.accum = 0;

    if (this.phase === "playing" && !this.deathPending) {
      this.shake *= Math.pow(0.9, dt * 60);
    } else {
      this.shake = 0;
    }

    this.render();
  }

  private fixedStep(dt: number): void {
    if (this.phase === "title") {
      if (this.input.consumeJump()) {
        void audio.resumeAudio();
        this.beginRun();
      }
      return;
    }
    if (this.phase === "gameover" || this.phase === "won") {
      if (this.input.consumeJump()) {
        void audio.resumeAudio();
        if (this.phase === "won") {
          this.phase = "title";
          audio.stopBackgroundMusic();
        } else this.beginRun();
      }
      return;
    }

    // playing
    const wxHud = this.scroll + CANVAS_W * 0.4;
    const biomeNow = biomeAtX(this.level.segments, wxHud);
    updateParticles(this.particles, dt, biomeNow);

    if (this.toastT > 0) this.toastT -= dt;

    if (this.deathPending) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.phase = "gameover";
        this.deathPending = false;
        this.particles = [];
        if (this.runMaxScroll > this.runBest) {
          this.runBest = this.runMaxScroll;
          saveInt(STORAGE_BEST, this.runBest);
        }
        this.syncHud();
      }
      return;
    }

    if (this.invincibleMs > 0) this.invincibleMs -= dt * 1000;

    const footX = this.scroll + PLAYER_SCREEN_X + PLAYER_W * 0.5;
    const mul = effectiveSpeedMul(footX, this.level.segments);
    this.scroll += BASE_SPEED * mul * dt;
    this.runMaxScroll = Math.max(this.runMaxScroll, Math.floor(this.scroll));

    const jumped = this.input.consumeJump();
    const inv = this.invincibleMs > 0;
    const result = stepPlayer(
      dt,
      this.scroll,
      this.player,
      this.level,
      jumped,
      inv,
    );
    if (result.didJump && !this.muted) audio.playJumpSound();

    if (result.landed) {
      const cx = PLAYER_SCREEN_X + PLAYER_W * 0.5;
      this.particles.push(...spawnDustBurst(cx, GROUND_Y - 4));
    }

    if (biomeNow !== this.prevBiome) {
      this.prevBiome = biomeNow;
      this.toastText = BIOME_TOAST[biomeNow];
      this.toastT = 4.2;
    }

    if (result.status === "dead") {
      this.deathPending = true;
      this.deathTimer = DEATH_FREEZE_S;
      this.shake = this.reduceMotion ? 0 : 10;
      if (!this.muted) audio.playFailSound();
      return;
    }

    const footAfter = this.scroll + PLAYER_SCREEN_X + PLAYER_W * 0.5;
    if (footAfter >= this.level.totalLength - 70) {
      this.phase = "won";
      if (!this.muted) audio.playWinSound();
      if (this.runMaxScroll > this.runBest) {
        this.runBest = this.runMaxScroll;
        saveInt(STORAGE_BEST, this.runBest);
      }
      this.syncHud();
    }
  }

  private beginRun(): void {
    this.phase = "playing";
    this.scroll = 0;
    this.player = createPlayer();
    this.runMaxScroll = 0;
    this.invincibleMs = INVINCIBILITY_MS;
    this.deathPending = false;
    this.deathTimer = 0;
    this.prevBiome = biomeAtX(this.level.segments, 0);
    this.toastText = BIOME_TOAST[this.prevBiome];
    this.toastT = 3.2;
    this.particles = [];
    audio.ensureBackgroundMusic();
    audio.applyMusicVolume();
  }

  private render(): void {
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.shake > 0.5 && !this.reduceMotion) {
      ctx.translate(
        (Math.random() - 0.5) * this.shake,
        (Math.random() - 0.5) * this.shake,
      );
    }

    drawBackground(ctx, this.scroll, this.level.segments);
    const wx = this.scroll + CANVAS_W * 0.4;
    const biome = biomeAtX(this.level.segments, wx);
    drawGroundAndPits(ctx, this.scroll, this.level, biome);
    drawSolids(ctx, this.scroll, this.level, biome);
    drawHazards(ctx, this.scroll, this.level, biome);
    drawFinishRibbon(ctx, this.scroll, this.level.totalLength - 40);
    if (this.phase !== "title") {
      drawParticles(ctx, this.particles);
    }
    const flash =
      this.phase === "playing" &&
      this.invincibleMs > 0 &&
      Math.floor(this.invincibleMs / 140) % 2 === 0;
    if (this.phase !== "title") {
      drawPlayer(ctx, this.player, biome, flash);
    }

    this.drawUiOverlay(biome);
    ctx.restore();
  }

  private drawUiOverlay(biome: BiomeId): void {
    const { ctx } = this;
    if (this.phase === "title") {
      ctx.fillStyle = "rgba(13, 31, 22, 0.55)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#fffde7";
      ctx.textAlign = "center";
      ctx.font = "bold 42px system-ui,sans-serif";
      ctx.fillText("Forest Bros", CANVAS_W / 2, CANVAS_H * 0.32);
      ctx.font = "20px system-ui,sans-serif";
      ctx.fillText(
        "A brave little tree escapes the changing forest",
        CANVAS_W / 2,
        CANVAS_H * 0.4,
      );
      ctx.fillText(
        "to find a safer home. Help it jump the hazards!",
        CANVAS_W / 2,
        CANVAS_H * 0.44,
      );
      ctx.font = "bold 24px system-ui,sans-serif";
      ctx.fillText(
        "Tap or press Space to begin",
        CANVAS_W / 2,
        CANVAS_H * 0.58,
      );
    }

    if (this.phase === "playing" && this.scroll < 280 && !this.deathPending) {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, CANVAS_H - 72, CANVAS_W, 72);
      ctx.fillStyle = "#e8f5e9";
      ctx.font = "bold 22px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Tap / Space to jump", CANVAS_W / 2, CANVAS_H - 32);
    }

    if (
      this.phase === "playing" &&
      this.toastT > 0 &&
      this.toastText &&
      !this.deathPending
    ) {
      ctx.textAlign = "center";
      ctx.font = "italic 17px system-ui,sans-serif";
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.95, this.toastT * 0.35)})`;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 3;
      const ty = CANVAS_H * 0.14;
      ctx.strokeText(this.toastText, CANVAS_W / 2, ty);
      ctx.fillText(this.toastText, CANVAS_W / 2, ty);
    }

    if (
      this.phase === "playing" ||
      this.phase === "gameover" ||
      this.phase === "won"
    ) {
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "18px system-ui,sans-serif";
      ctx.fillText(`Distance: ${Math.floor(this.scroll)}m`, 16, 28);
      ctx.fillStyle = BIOMES[biome].accent;
      ctx.font = "14px system-ui,sans-serif";
      ctx.fillText(this.formatBiome(biome), 16, 50);
    }

    if (this.phase === "gameover") {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#ffebee";
      ctx.textAlign = "center";
      ctx.font = "bold 36px system-ui,sans-serif";
      ctx.fillText("Oops!", CANVAS_W / 2, CANVAS_H * 0.42);
      ctx.font = "22px system-ui,sans-serif";
      ctx.fillText("Tap / Space to try again", CANVAS_W / 2, CANVAS_H * 0.52);
    }

    if (this.phase === "won") {
      ctx.fillStyle = "rgba(26, 35, 126, 0.45)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#fff9c4";
      ctx.textAlign = "center";
      ctx.font = "bold 36px system-ui,sans-serif";
      ctx.fillText("You found a new home!", CANVAS_W / 2, CANVAS_H * 0.42);
      ctx.font = "22px system-ui,sans-serif";
      ctx.fillText("Tap / Space for title", CANVAS_W / 2, CANVAS_H * 0.52);
    }
  }

  private formatBiome(b: BiomeId): string {
    const labels: Record<BiomeId, string> = {
      meadow: "Meadow",
      deepForest: "Deep forest",
      riverbank: "Riverbank",
      wildfireEdge: "Wildfire edge",
      ashField: "Ash field",
      saplingGrove: "Sapling grove — home!",
    };
    return labels[b];
  }
}
