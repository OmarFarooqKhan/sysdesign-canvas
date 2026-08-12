import type { EdgeMode } from '../types';
import { perpUnit } from './geometry';

/** Project a screen-space drag delta onto a path's perpendicular, turning
 *  it into a signed bend offset (see `Edge.bend`). */
export function bendDelta(x1: number, y1: number, x2: number, y2: number, dx: number, dy: number): number {
  const p = perpUnit(x1, y1, x2, y2);
  return dx * p.x + dy * p.y;
}

/** Fraction of the mid-path bend also applied at the endpoints themselves, so
 *  a bent edge's ends sit apart from an unbent line between the same
 *  anchors — most visibly, so a reciprocal pair's two edges don't touch at
 *  the anchor point they'd otherwise share. */
const ENDPOINT_BEND_RATIO = 0.35;

/** Nudge both endpoints along their perpendicular by a fraction of `bend`. */
export function bowEndpoints(sx: number, sy: number, tx: number, ty: number, bend: number) {
  const p = perpUnit(sx, sy, tx, ty);
  const offset = bend * ENDPOINT_BEND_RATIO;
  return { sx: sx + p.x * offset, sy: sy + p.y * offset, tx: tx + p.x * offset, ty: ty + p.y * offset };
}

/** Point to anchor the edge label at: the path's visual midpoint,
 *  accounting for its bend, in whichever way the given mode bows it. */
export function edgeMidpoint(mode: EdgeMode, x1: number, y1: number, x2: number, y2: number, bend = 0) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (mode === 'ortho') {
    if (Math.abs(dx) >= Math.abs(dy)) return { x: (x1 + x2) / 2 + bend, y: (y1 + y2) / 2 };
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 + bend };
  }
  const p = perpUnit(x1, y1, x2, y2);
  return { x: (x1 + x2) / 2 + p.x * bend, y: (y1 + y2) / 2 + p.y * bend };
}
