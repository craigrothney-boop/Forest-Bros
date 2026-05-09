import type { BuiltLevel, SegmentDef } from "./types";
import { expandPattern } from "./patterns";
import { RUNWAY_END } from "../game/constants";

export const SEGMENTS: SegmentDef[] = [
  {
    length: 900,
    biome: "meadow",
    speedMul: 1,
    placements: [
      { patternId: "empty", at: 0 },
      { patternId: "singleSpike", at: 280 },
      { patternId: "lowBlock", at: 520 },
    ],
  },
  {
    length: 1000,
    biome: "meadow",
    speedMul: 1.05,
    placements: [
      { patternId: "doubleSpike", at: 200 },
      { patternId: "pitShort", at: 500 },
      { patternId: "blockSpike", at: 720 },
    ],
  },
  {
    length: 1100,
    biome: "deepForest",
    speedMul: 1.08,
    placements: [
      { patternId: "tripleSpike", at: 150 },
      { patternId: "stairBlocks", at: 400 },
      { patternId: "pitJumpSpike", at: 700 },
    ],
  },
  {
    length: 1150,
    biome: "deepForest",
    speedMul: 1.1,
    placements: [
      { patternId: "spikeRun", at: 120 },
      { patternId: "valleyPit", at: 480 },
      { patternId: "headBump", at: 750 },
    ],
  },
  {
    length: 1200,
    biome: "riverbank",
    speedMul: 1.12,
    placements: [
      { patternId: "platformGap", at: 180 },
      { patternId: "doubleSpike", at: 520 },
      { patternId: "pitLong", at: 780 },
    ],
  },
  {
    length: 1200,
    biome: "riverbank",
    speedMul: 1.15,
    placements: [
      { patternId: "mazeLow", at: 150 },
      { patternId: "tallBlockSpike", at: 480 },
      { patternId: "doublePit", at: 760 },
    ],
  },
  {
    length: 1250,
    biome: "wildfireEdge",
    speedMul: 1.18,
    placements: [
      { patternId: "pitJumpSpike", at: 140 },
      { patternId: "spikeRun", at: 460 },
      { patternId: "blockSpike", at: 780 },
    ],
  },
  {
    length: 1300,
    biome: "wildfireEdge",
    speedMul: 1.2,
    placements: [
      { patternId: "stairBlocks", at: 200 },
      { patternId: "pitLong", at: 520 },
      { patternId: "tripleSpike", at: 880 },
    ],
  },
  {
    length: 1350,
    biome: "ashField",
    speedMul: 1.22,
    placements: [
      { patternId: "doublePit", at: 160 },
      { patternId: "tallBlockSpike", at: 500 },
      { patternId: "headBump", at: 860 },
    ],
  },
  {
    length: 1400,
    biome: "ashField",
    speedMul: 1.25,
    placements: [
      { patternId: "platformGap", at: 220 },
      { patternId: "mazeLow", at: 560 },
      { patternId: "pitJumpSpike", at: 920 },
    ],
  },
  {
    length: 1500,
    biome: "saplingGrove",
    speedMul: 1.12,
    placements: [
      { patternId: "singleSpike", at: 200 },
      { patternId: "lowBlock", at: 500 },
      { patternId: "doubleSpike", at: 820 },
      { patternId: "empty", at: 1100 },
    ],
  },
];

export function buildLevel(segments: SegmentDef[] = SEGMENTS): BuiltLevel {
  const solids: BuiltLevel["solids"] = [];
  const hazards: BuiltLevel["hazards"] = [];
  const voids: BuiltLevel["voids"] = [];
  const segMeta: BuiltLevel["segments"] = [];

  let segStart = RUNWAY_END;
  for (const seg of segments) {
    const x0 = segStart;
    const x1 = segStart + seg.length;
    segMeta.push({ x0, x1, biome: seg.biome, speedMul: seg.speedMul });

    for (const p of seg.placements) {
      const off = segStart + p.at;
      const expanded = expandPattern(p.patternId, off);
      solids.push(...expanded.solids);
      hazards.push(...expanded.hazards);
      voids.push(...expanded.voids);
    }
    segStart = x1;
  }

  const totalLength = segStart + 720;

  return { solids, hazards, voids, totalLength, segments: segMeta };
}
