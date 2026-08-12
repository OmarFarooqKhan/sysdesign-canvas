import type { EdgeMode, GraphData, GraphState } from '../types';

/** Snapshot the live graph into a serializable diagram. */
export function toData(state: GraphState, edgeMode: EdgeMode): GraphData {
  return {
    edgeMode,
    nodes: Object.values(state.nodes),
    edges: state.edges,
    regions: state.regions,
  };
}

/** Trigger a browser download of the diagram as pretty JSON. */
export function download(data: GraphData, filename = 'system-design.json'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse + validate a diagram file's text. Throws on malformed input.
 *  The returned `edgeMode` is always resolved (never undefined). */
export function parse(text: string): GraphData & { edgeMode: EdgeMode } {
  const d = JSON.parse(text) as Partial<GraphData>;
  if (!Array.isArray(d.nodes) || !Array.isArray(d.edges) || !Array.isArray(d.regions)) {
    throw new Error('Invalid diagram: expected nodes, edges and regions arrays');
  }
  const edgeMode: EdgeMode = d.edgeMode === 'ortho' ? 'ortho' : 'curved';
  return { edgeMode, nodes: d.nodes, edges: d.edges, regions: d.regions };
}
