import type { HazardRect, SolidRect, VoidRange } from "./types";

/** Pattern items use coordinates relative to pattern origin; y is top-down canvas coords. */
export interface PatternResult {
  solids: SolidRect[];
  hazards: HazardRect[];
  voids: VoidRange[];
}

type PatternFn = () => PatternResult;

const G = 460; // ground surface y (top of runway)

function spike(x: number, w = 28, h = 36): HazardRect {
  return { kind: "hazard", x, y: G - h, w, h };
}

function block(x: number, y: number, w: number, h: number): SolidRect {
  return { kind: "solid", x, y, w, h };
}

function pit(x: number, width: number): VoidRange {
  return { x0: x, x1: x + width };
}

const PATTERNS: Record<string, PatternFn> = {
  empty: () => ({ solids: [], hazards: [], voids: [] }),

  singleSpike: () => ({
    solids: [],
    hazards: [spike(120)],
    voids: [],
  }),

  doubleSpike: () => ({
    solids: [],
    hazards: [spike(100, 26, 34), spike(200, 26, 34)],
    voids: [],
  }),

  tripleSpike: () => ({
    solids: [],
    hazards: [spike(90), spike(170), spike(250)],
    voids: [],
  }),

  lowBlock: () => ({
    solids: [block(140, G - 70, 80, 70)],
    hazards: [],
    voids: [],
  }),

  blockSpike: () => ({
    solids: [block(130, G - 56, 72, 56)],
    hazards: [spike(240, 28, 36)],
    voids: [],
  }),

  pitShort: () => ({
    solids: [],
    hazards: [],
    voids: [pit(160, 100)],
  }),

  pitLong: () => ({
    solids: [],
    hazards: [],
    voids: [pit(140, 160)],
  }),

  pitJumpSpike: () => ({
    solids: [],
    hazards: [spike(320, 30, 38)],
    voids: [pit(120, 140)],
  }),

  stairBlocks: () => ({
    solids: [
      block(110, G - 44, 52, 44),
      block(200, G - 88, 52, 88),
      block(290, G - 52, 60, 52),
    ],
    hazards: [],
    voids: [],
  }),

  headBump: () => ({
    solids: [
      block(100, G - 120, 200, 24),
      block(100, G - 24, 52, 24),
    ],
    hazards: [spike(280)],
    voids: [],
  }),

  valleyPit: () => ({
    solids: [block(100, G - 40, 70, 40)],
    hazards: [],
    voids: [pit(200, 120)],
  }),

  spikeRun: () => ({
    solids: [],
    hazards: [spike(80), spike(150), spike(220), spike(290)],
    voids: [],
  }),

  platformGap: () => ({
    solids: [
      block(90, G - 110, 100, 18),
      block(260, G - 110, 100, 18),
    ],
    hazards: [],
    voids: [pit(120, 100)],
  }),

  tallBlockSpike: () => ({
    solids: [block(120, G - 120, 64, 120)],
    hazards: [spike(240), spike(300)],
    voids: [],
  }),

  doublePit: () => ({
    solids: [],
    hazards: [spike(380)],
    voids: [pit(100, 90), pit(260, 90)],
  }),

  mazeLow: () => ({
    solids: [
      block(100, G - 50, 44, 50),
      block(190, G - 50, 44, 50),
      block(280, G - 50, 44, 50),
    ],
    hazards: [spike(155), spike(245)],
    voids: [],
  }),
};

export function expandPattern(patternId: string, offsetX: number): PatternResult {
  const fn = PATTERNS[patternId] ?? PATTERNS.empty;
  const r = fn();
  const shiftSolid = (s: SolidRect): SolidRect => ({
    ...s,
    x: s.x + offsetX,
  });
  const shiftHaz = (h: HazardRect): HazardRect => ({
    ...h,
    x: h.x + offsetX,
  });
  const shiftVoid = (v: VoidRange): VoidRange => ({
    x0: v.x0 + offsetX,
    x1: v.x1 + offsetX,
  });
  return {
    solids: r.solids.map(shiftSolid),
    hazards: r.hazards.map(shiftHaz),
    voids: r.voids.map(shiftVoid),
  };
}
