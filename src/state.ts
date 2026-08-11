import type { GraphNode, Edge, Region, EdgeMode } from './types';
import { canvas, svg, empty } from './dom';

/** Live collections. Kept as mutable const containers so ES-module
 *  consumers share the same reference (never reassign these). */
export const nodes: Record<string, GraphNode> = {};
export const edges: Edge[] = [];
export const regions: Region[] = [];

/** Monotonic id counters (bumped on create, reset on clear/import). */
export const ids = { n: 0, e: 0, r: 0 };

/** Transient UI selection + rendering mode. */
export const ui = {
  selected: null as string | null,
  selectedRegion: null as string | null,
  edgeMode: 'curved' as EdgeMode,
};

export { canvas, svg, empty };

/** Show the "drag a component" hint only when the canvas is truly empty. */
export function refreshEmpty(): void {
  const isEmpty = Object.keys(nodes).length === 0 && regions.length === 0;
  empty.style.display = isEmpty ? 'block' : 'none';
}
