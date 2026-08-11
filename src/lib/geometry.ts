import type { EdgeMode, GraphNode } from '../types';

export const NODE_W = 96;
export const NODE_H = 64;

/** Right-hand port anchor (where an edge leaves a source node). */
export function portCenter(n: GraphNode) {
  return { x: n.x + NODE_W - 16, y: n.y + NODE_H / 2 };
}

/** Center-x / mid-y anchor of a node box. */
export function nodeCenter(n: GraphNode) {
  return { x: n.x + 48, y: n.y + NODE_H / 2 };
}

/** SVG path between two points for the given edge mode. */
export function edgePath(mode: EdgeMode, x1: number, y1: number, x2: number, y2: number): string {
  if (mode === 'ortho') {
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`;
  }
  const dx = Math.abs(x2 - x1) * 0.5 + 20;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

/** Endpoints for an edge from source `a` to target `b`. */
export function edgeEndpoints(a: GraphNode, b: GraphNode) {
  const s = portCenter(a);
  const t = nodeCenter(b);
  const tx = t.x + (s.x > t.x ? 48 : -48);
  return { sx: s.x, sy: s.y, tx, ty: t.y };
}
