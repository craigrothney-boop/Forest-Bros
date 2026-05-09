import type { BiomeId } from "./types";

export interface BiomePalette {
  skyTop: string;
  skyBottom: string;
  ground: string;
  groundLine: string;
  accent: string;
  hazard: string;
  parallaxFar: string;
  parallaxMid: string;
  parallaxNear: string;
}

export const BIOMES: Record<BiomeId, BiomePalette> = {
  meadow: {
    skyTop: "#87ceeb",
    skyBottom: "#c8e6c9",
    ground: "#558b2f",
    groundLine: "#33691e",
    accent: "#fff59d",
    hazard: "#c62828",
    parallaxFar: "#a5d6a7",
    parallaxMid: "#66bb6a",
    parallaxNear: "#43a047",
  },
  deepForest: {
    skyTop: "#1b3d2f",
    skyBottom: "#2e5c45",
    ground: "#1e4628",
    groundLine: "#0d2818",
    accent: "#8bc34a",
    hazard: "#b71c1c",
    parallaxFar: "#1b3328",
    parallaxMid: "#254d3a",
    parallaxNear: "#2d6b4f",
  },
  riverbank: {
    skyTop: "#4fc3f7",
    skyBottom: "#b3e5fc",
    ground: "#6d8b3f",
    groundLine: "#3e5622",
    accent: "#29b6f6",
    hazard: "#c62828",
    parallaxFar: "#81d4fa",
    parallaxMid: "#4dd0e1",
    parallaxNear: "#26a69a",
  },
  wildfireEdge: {
    skyTop: "#5d4037",
    skyBottom: "#ff8f00",
    ground: "#4e342e",
    groundLine: "#3e2723",
    accent: "#ff6f00",
    hazard: "#bf360c",
    parallaxFar: "#6d4c41",
    parallaxMid: "#8d4e37",
    parallaxNear: "#a1887f",
  },
  ashField: {
    skyTop: "#37474f",
    skyBottom: "#78909c",
    ground: "#455a64",
    groundLine: "#263238",
    accent: "#b0bec5",
    hazard: "#d32f2f",
    parallaxFar: "#546e7a",
    parallaxMid: "#607d8b",
    parallaxNear: "#78909c",
  },
  saplingGrove: {
    skyTop: "#1a237e",
    skyBottom: "#c8e6c9",
    ground: "#2e7d32",
    groundLine: "#1b5e20",
    accent: "#ffd54f",
    hazard: "#ad1457",
    parallaxFar: "#9fa8da",
    parallaxMid: "#66bb6a",
    parallaxNear: "#43a047",
  },
};

export function biomeAtX(
  segments: { x0: number; x1: number; biome: BiomeId }[],
  worldX: number,
): BiomeId {
  for (const s of segments) {
    if (worldX >= s.x0 && worldX < s.x1) return s.biome;
  }
  return segments[segments.length - 1]?.biome ?? "meadow";
}
