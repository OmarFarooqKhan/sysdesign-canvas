import type { EdgeMode, GraphNode, GraphState, WalkStep } from '../types';
import { edgeEndpoints, insetEndpoints, nodeCenter } from './geometry';
import { bowEndpoints, edgeMidpoint } from './edgeBend';
import { edgePath } from './edgePath';
import { autoBend } from './reciprocalBend';
import type { Viewport } from './viewport';

/** Neon green for the traveling "request" dot. Deliberately not --accent (selection)
 *  or --accent-2 (ports/linking): blue = "where you are", green = "the thing moving". */
export const DOT_COLOR = '#39ff14';

/** Width of the playthrough panel; must match .walk-panel in index.css. */
export const PANEL_W = 228;

export interface ResolvedStep { step: WalkStep; node: GraphNode }

/** Steps whose node still exists, in authored order. Orphaned steps (their node
 *  was deleted) are skipped here at playback time, never deleted from state. */
export function resolveSteps(state: GraphState): ResolvedStep[] {
  return (state.walkthrough ?? [])
    .filter((w) => state.nodes[w.nodeId])
    .map((w) => ({ step: w, node: state.nodes[w.nodeId] }));
}

/** Whether the node has an authored playthrough step. */
export const hasWalkStep = (state: GraphState, nodeId: string): boolean =>
  !!state.walkthrough?.some((w) => w.nodeId === nodeId);

/** Clamp a step index into [0, count - 1] (0 when there are no steps). */
export const clampStep = (i: number, count: number): number =>
  Math.max(0, Math.min(i, count - 1));

/** Node id of the current (clamped) step, or null when there are no steps. */
export function activeStepNodeId(state: GraphState, i: number): string | null {
  const resolved = resolveSteps(state);
  return resolved.length ? resolved[clampStep(i, resolved.length)].node.id : null;
}

export interface Hop {
  d: string;
  /** True when the connecting edge is drawn opposite to travel direction; the dot
   *  then runs the drawn path backwards (SMIL keyPoints), never a mirrored path. */
  reverse: boolean;
  edgeId: string | null;
  /** Midpoint of the hop path, for the reduced-motion static dot. */
  mid: { x: number; y: number };
}

/** The hop into step `i`: null for step 0 (the dot parks on the first node), else the
 *  path from step i-1's node — the existing edge between the two nodes rendered with
 *  EdgeView's exact geometry pipeline, or a plain anchor-to-anchor line when no edge
 *  connects them. */
export function hopForStep(state: GraphState, edgeMode: EdgeMode, resolved: ResolvedStep[], i: number): Hop | null {
  if (i <= 0 || i >= resolved.length) return null;
  const prev = resolved[i - 1].node;
  const cur = resolved[i].node;
  const edge = state.edges.find(
    (e) => (e.from === prev.id && e.to === cur.id) || (e.from === cur.id && e.to === prev.id),
  );
  if (!edge) {
    const a = edgeEndpoints(prev, cur);
    const d = `M ${a.sx} ${a.sy} L ${a.tx} ${a.ty}`;
    return { d, reverse: false, edgeId: null, mid: { x: (a.sx + a.tx) / 2, y: (a.sy + a.ty) / 2 } };
  }
  const from = state.nodes[edge.from];
  const to = state.nodes[edge.to];
  const bend = edge.bend ?? autoBend(state.edges, edge, from, to);
  const a = edgeEndpoints(from, to);
  const inset = insetEndpoints(a.sx, a.sy, a.tx, a.ty, !!edge.bidirectional);
  const b = bowEndpoints(inset.sx, inset.sy, inset.tx, inset.ty, bend);
  return {
    d: edgePath(edgeMode, b.sx, b.sy, b.tx, b.ty, bend),
    reverse: edge.from !== prev.id,
    edgeId: edge.id,
    mid: edgeMidpoint(edgeMode, b.sx, b.sy, b.tx, b.ty, bend),
  };
}

/** Where the dot parks for step 0: the first node's border anchor facing the second
 *  step's node, or its left border anchor when the tour has a single step. */
export function parkPoint(resolved: ResolvedStep[]): { x: number; y: number } {
  const n = resolved[0].node;
  if (resolved.length < 2) return { x: n.x, y: nodeCenter(n).y };
  const a = edgeEndpoints(n, resolved[1].node);
  return { x: a.sx, y: a.sy };
}

/** Pan that centers `center` in the viewport area left of the panel (zoom untouched):
 *  the node lands at ((viewportW - rightInset) / 2, viewportH / 2) at the current zoom. */
export function panToStep(
  vp: Viewport, viewportW: number, viewportH: number, center: { x: number; y: number }, rightInset: number,
): { panX: number; panY: number } {
  return {
    panX: (viewportW - rightInset) / 2 - center.x * vp.zoom,
    panY: viewportH / 2 - center.y * vp.zoom,
  };
}
