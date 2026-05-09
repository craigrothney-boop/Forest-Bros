export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function rectBottom(r: Rect): number {
  return r.y + r.h;
}
