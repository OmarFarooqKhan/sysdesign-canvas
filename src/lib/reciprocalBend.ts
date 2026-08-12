import type { Edge, GraphNode } from '../types';
import { nodeCenter } from './geometry';

/** Bow applied to a reciprocal pair, as a fraction of the distance between
 *  the two nodes (capped, but with no floor), rather than a fixed pixel
 *  amount — a fixed bow is large relative to short edges, which distorts
 *  the bezier's end tangent enough that the arrowhead (oriented from that
 *  tangent by `auto-start-reverse`) stops pointing cleanly at the node.
 *  Letting it shrink to ~0 for close/overlapping nodes keeps the arrow
 *  aimed at the node instead; a floor here would reintroduce that
 *  distortion for exactly the pairs that need it least. */
const BEND_RATIO = 0.18;
const BEND_MAX = 42;

/** Default bend for `edge`, used until a manual drag sets `edge.bend`. Zero
 *  unless a reciprocal edge (same pair, opposite direction) exists, in which
 *  case both sides of the pair get the *same* signed bend. That looks
 *  backwards, but a reciprocal edge's endpoints are the swap of this edge's
 *  (source becomes target and vice versa), which already negates the
 *  perpendicular bow direction in `edgePath`/`perpUnit` — so an equal bend
 *  here is what makes the two curves bow to opposite sides and separate
 *  into two arcs. Signing them oppositely here would cancel that inversion
 *  out and leave both edges tracing the same curve. */
export function autoBend(edges: Edge[], edge: Edge, from: GraphNode, to: GraphNode): number {
  const hasReciprocal = edges.some((e) => e.from === edge.to && e.to === edge.from);
  if (!hasReciprocal) return 0;
  const c1 = nodeCenter(from);
  const c2 = nodeCenter(to);
  const dist = Math.hypot(c2.x - c1.x, c2.y - c1.y);
  return Math.min(dist * BEND_RATIO, BEND_MAX);
}
