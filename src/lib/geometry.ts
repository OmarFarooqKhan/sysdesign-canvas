import type { EdgeMode, GraphNode } from '../types';

export const NODE_W = 96;
export const NODE_H = 64;

type Side = 'left' | 'right' | 'top' | 'bottom';

/** Center-x / mid-y anchor of a node box. */
export function nodeCenter(n: GraphNode) {
  return { x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 };
}

/** Midpoint of the given side, on the node's border. */
function sideAnchor(n: GraphNode, side: Side) {
  const c = nodeCenter(n);
  if (side === 'left') return { x: n.x, y: c.y };
  if (side === 'right') return { x: n.x + NODE_W, y: c.y };
  if (side === 'top') return { x: c.x, y: n.y };
  return { x: c.x, y: n.y + NODE_H };
}

/** Which side of a node faces a point offset by (dx, dy) from its center. */
function facingSide(dx: number, dy: number): Side {
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}

/** Border anchors for an edge from `a` to `b`: whichever side of each node
 *  faces the other (left/right/top/bottom), at the midpoint of that side. */
export function edgeEndpoints(a: GraphNode, b: GraphNode) {
  const ca = nodeCenter(a);
  const cb = nodeCenter(b);
  const dx = cb.x - ca.x;
  const dy = cb.y - ca.y;
  const s = sideAnchor(a, facingSide(dx, dy));
  const t = sideAnchor(b, facingSide(-dx, -dy));
  return { sx: s.x, sy: s.y, tx: t.x, ty: t.y };
}

const GAP = 4;

/** Pull endpoints back off their node borders so arrowhead markers float
 *  clear instead of touching. The target is always inset (markerEnd is
 *  always drawn); the source only when the edge is bidirectional. */
export function insetEndpoints(
  sx: number, sy: number, tx: number, ty: number, bidirectional: boolean, gap = GAP,
) {
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return {
    sx: bidirectional ? sx + ux * gap : sx,
    sy: bidirectional ? sy + uy * gap : sy,
    tx: tx - ux * gap,
    ty: ty - uy * gap,
  };
}

/** Unit vector perpendicular to the segment from (x1,y1) to (x2,y2). */
export function perpUnit(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  // `|| 0` normalizes away -0 (e.g. when dy is 0), which would otherwise
  // compare unequal to a plain 0 in strict/deep-equality assertions.
  return { x: (-dy / len) || 0, y: (dx / len) || 0 };
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
    const ext = Math.abs(dx) * 0.5 + 20;
    return `M ${x1} ${y1} C ${x1 + ext + bx} ${y1 + by}, ${x2 - ext + bx} ${y2 + by}, ${x2} ${y2}`;
  }
  const ext = Math.abs(dy) * 0.5 + 20;
  return `M ${x1} ${y1} C ${x1 + bx} ${y1 + ext + by}, ${x2 + bx} ${y2 - ext + by}, ${x2} ${y2}`;
}
