import type { Edge, GraphNode, GraphState } from '../types';

/** Nodes + edges captured from a selection, for copy/paste/duplicate. Plain data — lives in a
 *  UIContext slot until pasted, never serialized, never undoable on its own. */
export interface ClipboardData {
  nodes: GraphNode[];
  edges: Edge[];
}

/** Snapshot the given node ids plus only the edges whose both endpoints are also in `ids`. */
export function snapshotSelection(state: GraphState, ids: string[]): ClipboardData {
  const idSet = new Set(ids);
  const nodes = ids.map((id) => state.nodes[id]);
  const edges = state.edges.filter((e) => idSet.has(e.from) && idSet.has(e.to));
  return { nodes, edges };
}

const PASTE_OFFSET = 16;

/** Offsets a clipboard snapshot's node positions (default +16/+16), so a paste lands visibly
 *  apart from the copied originals instead of exactly on top of them. */
export function offsetClipboard(clip: ClipboardData, dx = PASTE_OFFSET, dy = PASTE_OFFSET): ClipboardData {
  return { nodes: clip.nodes.map((n) => ({ ...n, x: n.x + dx, y: n.y + dy })), edges: clip.edges };
}
