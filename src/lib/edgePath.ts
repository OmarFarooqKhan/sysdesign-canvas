import type { EdgeMode } from '../types';
import { perpUnit } from './geometry';

/** Cap on a control point's "handle" length (see `edgePath`). Uncapped, the
 *  handle grows linearly with edge length (half the distance), so a long
 *  edge that happens to route past other nodes gets a handle bigger than
 *  the gap it needs to bridge — the curve shoots off along the dominant
 *  axis well past a direct line before swinging back to the target,
 *  reading as a loop instead of an arrow pointing at the node. Capping it
 *  keeps long edges' curvature proportional to what a short edge gets. */
const EXT_MAX = 80;

/** Signed handle length: half the distance plus a fixed kick (so even
 *  coincident/adjacent endpoints get a visible curve), clamped to
 *  `EXT_MAX` and sign-preserving. */
function clampedExt(d: number, fallback = 1): number {
  const ext = d / 2 + Math.sign(d || fallback) * 20;
  return Math.sign(ext) * Math.min(Math.abs(ext), EXT_MAX);
}

/** SVG path between two points for the given edge mode, bowed by `bend`
 *  (a signed offset applied at the path's midpoint). Control points extend
 *  along whichever axis dominates the direction between the two points, so
 *  vertical anchor pairs (top/bottom) route as sensibly as horizontal ones. */
export function edgePath(mode: EdgeMode, x1: number, y1: number, x2: number, y2: number, bend = 0): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (mode === 'ortho') {
    if (Math.abs(dx) >= Math.abs(dy)) {
      const mx = (x1 + x2) / 2 + bend;
      return `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`;
    }
    const my = (y1 + y2) / 2 + bend;
    return `M ${x1} ${y1} L ${x1} ${my} L ${x2} ${my} L ${x2} ${y2}`;
  }
  const p = perpUnit(x1, y1, x2, y2);
  const bx = p.x * bend;
  const by = p.y * bend;
  if (Math.abs(dx) >= Math.abs(dy)) {
    // Signed, not abs: pulls each control point toward the other endpoint. An
    // unsigned extension pushes both outward when the target is behind the
    // source (dx < 0), flipping the arrival tangent so the arrowhead faces away.
    const ext = clampedExt(dx);
    return `M ${x1} ${y1} C ${x1 + ext + bx} ${y1 + by}, ${x2 - ext + bx} ${y2 + by}, ${x2} ${y2}`;
  }
  // dy is never 0 here (this branch only runs when |dy| > |dx|), so no `|| 1` fallback.
  const ext = clampedExt(dy, 0);
  return `M ${x1} ${y1} C ${x1 + bx} ${y1 + ext + by}, ${x2 + bx} ${y2 - ext + by}, ${x2} ${y2}`;
}
