import { NODE_H, NODE_W } from './geometry';

export const GRID = 8;
const TOLERANCE = 4;

/** Rounds a coordinate to the nearest multiple of `grid`. `|| 0` normalizes away -0 (e.g.
 *  snapping a small negative value to the zero line), which would otherwise compare unequal
 *  to a plain 0 in strict/deep-equality assertions — see geometry.ts's perpUnit for the same
 *  fix. */
export function snapToGrid(v: number, grid = GRID): number {
  return (Math.round(v / grid) * grid) || 0;
}

export interface Point { x: number; y: number }

export interface GuideMatch {
  x: number;
  y: number;
  /** Canvas-space x coordinates of matched vertical guide lines (deduped). */
  vertical: number[];
  /** Canvas-space y coordinates of matched horizontal guide lines (deduped). */
  horizontal: number[];
}

const xEdges = (x: number): number[] => [x, x + NODE_W / 2, x + NODE_W];
const yEdges = (y: number): number[] => [y, y + NODE_H / 2, y + NODE_H];

/**
 * Grid-snaps a dragged node's candidate top-left (x, y), then checks whether any of its own
 * edges/center (left/center/right, top/center/bottom) align — within `tolerance` px — with any
 * other node's edges/center. A match snaps that axis exactly to the alignment instead of the
 * grid, and its coordinate is reported so the caller can render a guide line through it.
 */
export function alignmentGuides(dragged: Point, others: Point[], tolerance = TOLERANCE): GuideMatch {
  let x = snapToGrid(dragged.x);
  let y = snapToGrid(dragged.y);
  const vertical = new Set<number>();
  const horizontal = new Set<number>();
  const dxs = xEdges(dragged.x);
  const dys = yEdges(dragged.y);

  for (const o of others) {
    for (const oe of xEdges(o.x)) {
      const hit = dxs.find((de) => Math.abs(de - oe) <= tolerance);
      if (hit !== undefined) { x = dragged.x + (oe - hit); vertical.add(oe); }
    }
    for (const oe of yEdges(o.y)) {
      const hit = dys.find((de) => Math.abs(de - oe) <= tolerance);
      if (hit !== undefined) { y = dragged.y + (oe - hit); horizontal.add(oe); }
    }
  }

  return { x, y, vertical: [...vertical], horizontal: [...horizontal] };
}
