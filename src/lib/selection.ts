import type { GraphNode } from '../types';
import { NODE_H, NODE_W } from './geometry';

/** Axis-aligned rectangle, in canvas (zoom/pan-aware) coordinates. */
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
