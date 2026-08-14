import type { EdgeMode, GraphData, GraphState, WalkStep } from '../types';
import { downloadBlob } from './dom';

/** Snapshot the live graph into a serializable diagram. */
export function toData(state: GraphState, edgeMode: EdgeMode): GraphData {
  const data: GraphData = {
    edgeMode,
    nodes: Object.values(state.nodes),
    edges: state.edges,
    regions: state.regions,
  };
  if (state.walkthrough) data.walkthrough = state.walkthrough;
  return data;
}

/** Trigger a browser download of the diagram as pretty JSON. */
export function download(data: GraphData, filename = 'system-design.json'): void {
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename);
}

/** Whether `w` is a well-formed walkthrough: an array of { nodeId, text } string pairs. */
function isWalkthrough(w: unknown): w is WalkStep[] {
  return Array.isArray(w) && w.every(
    (s: unknown) => typeof s === 'object' && s !== null &&
      typeof (s as Record<string, unknown>).nodeId === 'string' &&
      typeof (s as Record<string, unknown>).text === 'string',
  );
}

/** Parse + validate a diagram file's text. Throws on malformed input.
 *  The returned `edgeMode` is always resolved (never undefined). A malformed
 *  `walkthrough` is silently dropped instead — the rest of the diagram is valid. */
export function parse(text: string): GraphData & { edgeMode: EdgeMode } {
  const d = JSON.parse(text) as Partial<GraphData>;
  if (!Array.isArray(d.nodes) || !Array.isArray(d.edges) || !Array.isArray(d.regions)) {
    throw new Error('Invalid diagram: expected nodes, edges and regions arrays');
  }
  const edgeMode: EdgeMode = d.edgeMode === 'ortho' ? 'ortho' : 'curved';
  const data: GraphData & { edgeMode: EdgeMode } = { edgeMode, nodes: d.nodes, edges: d.edges, regions: d.regions };
  if (isWalkthrough(d.walkthrough)) data.walkthrough = d.walkthrough;
  return data;
}
