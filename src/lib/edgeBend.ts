import type { EdgeMode } from '../types';
import { perpUnit } from './geometry';

/** Project a screen-space drag delta onto a path's perpendicular, turning
 *  it into a signed bend offset (see `Edge.bend`). */
export function bendDelta(x1: number, y1: number, x2: number, y2: number, dx: number, dy: number): number {
  const p = perpUnit(x1, y1, x2, y2);
  return dx * p.x + dy * p.y;
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
