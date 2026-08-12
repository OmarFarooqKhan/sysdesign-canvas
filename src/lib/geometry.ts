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

/**
 * Axis-aligned rectangle. Marquee selection currently builds these from raw
 * client coordinates (no zoom/pan transform exists yet) — once the viewport
 * lands, route the drag points through its screen->canvas conversion before
 * calling `rectFromPoints`, and this helper and `nodesInRect` need no changes.
 */
export interface Rect { x: number; y: number; w: number; h: number; }

/** Normalizes two drag points (in either order) into a non-negative-size rect. */
export function rectFromPoints(x1: number, y1: number, x2: number, y2: number): Rect {
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
}

/** True when two axis-aligned rects overlap (edge-touching does not count). */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Ids of nodes (NODE_W x NODE_H boxes at node.x/node.y) whose box intersects `rect`. */
export function nodesInRect(nodes: GraphNode[], rect: Rect): string[] {
  return nodes.filter((n) => rectsIntersect(rect, { x: n.x, y: n.y, w: NODE_W, h: NODE_H })).map((n) => n.id);
}

export interface NodeSnapshot { id: string; x: number; y: number; }

/** Snapshot of {id,x,y} for `ids`, taken at drag start so a group move has a fixed baseline. */
export function nodeSnapshot(nodes: Record<string, GraphNode>, ids: string[]): NodeSnapshot[] {
  return ids.map((id) => ({ id, x: nodes[id]?.x ?? 0, y: nodes[id]?.y ?? 0 }));
}

/** Applies a uniform (dx,dy) offset to a snapshot, clamping each result to non-negative. */
export function offsetSnapshot(snap: NodeSnapshot[], dx: number, dy: number): NodeSnapshot[] {
  return snap.map((g) => ({ id: g.id, x: Math.max(0, g.x + dx), y: Math.max(0, g.y + dy) }));
}
