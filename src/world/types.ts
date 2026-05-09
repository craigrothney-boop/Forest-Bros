export type BiomeId =
  | "meadow"
  | "deepForest"
  | "riverbank"
  | "wildfireEdge"
  | "ashField"
  | "saplingGrove";

export interface SolidRect extends RectLike {
  kind: "solid";
}

export interface HazardRect extends RectLike {
  kind: "hazard";
}

export interface VoidRange {
  x0: number;
  x1: number;
}

interface RectLike {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SegmentDef {
  length: number;
  biome: BiomeId;
  speedMul: number;
  placements: { patternId: string; at: number }[];
}

export interface BuiltLevel {
  solids: SolidRect[];
  hazards: HazardRect[];
  voids: VoidRange[];
  totalLength: number;
  segments: { x0: number; x1: number; biome: BiomeId; speedMul: number }[];
}
