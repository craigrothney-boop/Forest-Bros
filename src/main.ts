import { buildLevel } from "./world/segments";
import { Game } from "./game/Game";
import { loadPlayerAtlas } from "./render/playerSprite";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const hud = document.querySelector<HTMLElement>("#hud");

if (!canvas || !hud) {
  throw new Error("Missing #game or #hud");
}

const level = buildLevel();

async function boot(): Promise<void> {
  let atlas: HTMLImageElement | null = null;
  try {
    atlas = await loadPlayerAtlas();
  } catch {
    console.warn("Forest Bros: player atlas missing; using fallback art.");
  }
  const game = new Game(canvas!, level, hud!, atlas);
  game.start();
}

void boot();
