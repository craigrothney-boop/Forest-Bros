import { buildLevel } from "./world/segments";
import { Game } from "./game/Game";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const hud = document.querySelector<HTMLElement>("#hud");

if (!canvas || !hud) {
  throw new Error("Missing #game or #hud");
}

const level = buildLevel();
const game = new Game(canvas, level, hud);
game.start();
