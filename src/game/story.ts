import type { BiomeId } from "../world/types";

/** Short, non-blocking flavor when entering a new biome. */
export const BIOME_TOAST: Record<BiomeId, string> = {
  meadow: "Fresh air… but the forest feels restless today.",
  deepForest: "The old trees whisper: hurry, little one.",
  riverbank: "Cool water ahead — mind the slippery stones!",
  wildfireEdge: "Smoke on the wind. Keep moving.",
  ashField: "Even burnt ground can teach us where to grow.",
  saplingGrove: "New green — maybe this is home.",
};
