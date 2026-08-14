import type { Edge, GraphData, GraphNode, GraphState, NodeDef, Region } from '../types';

export const REGION_COLORS = ['#4f8cff', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8'];

export type GraphAction =
  | { type: 'ADD_NODE'; def: NodeDef; x: number; y: number }
  | { type: 'MOVE_NODE'; id: string; x: number; y: number }
  | { type: 'MOVE_NODES'; moves: { id: string; x: number; y: number }[] }
  | { type: 'RENAME_NODE'; id: string; label: string }
  | { type: 'SET_NODE_DB'; id: string; db: NonNullable<GraphNode['db']> }
  | { type: 'SET_NODE_NOTES'; id: string; notes: string }
  | { type: 'DELETE_NODE'; id: string }
  | { type: 'ADD_EDGE'; from: string; to: string; label?: string }
  | { type: 'LABEL_EDGE'; id: string; label: string }
  | { type: 'DELETE_EDGE'; id: string }
  | { type: 'TOGGLE_EDGE_DIRECTION'; id: string }
  | { type: 'BEND_EDGE'; id: string; bend: number }
  | { type: 'ADD_REGION'; region?: Partial<Region> }
  | { type: 'MOVE_REGION'; id: string; x: number; y: number }
  | { type: 'RESIZE_REGION'; id: string; w: number; h: number }
  | { type: 'RENAME_REGION'; id: string; title: string }
  | { type: 'DELETE_REGION'; id: string }
  | { type: 'LOAD'; data: GraphData }
  | { type: 'CLEAR' }
  | { type: 'ADD_ITEMS'; nodes: GraphNode[]; edges: Edge[] }
  | { type: 'SET_WALK_STEP'; nodeId: string; text: string }
  | { type: 'REMOVE_WALK_STEP'; nodeId: string }
  | { type: 'MOVE_WALK_STEP'; from: number; to: number };

const SESSION_TYPES = new Set<GraphAction['type']>([
  'MOVE_NODE', 'MOVE_NODES', 'MOVE_REGION', 'RESIZE_REGION', 'BEND_EDGE',
]);

/** Drag/resize actions coalesce into a single undo entry. */
export const isSessionAction = (a: GraphAction): boolean => SESSION_TYPES.has(a.type);

export const emptyGraph = (): GraphState => ({ nodes: {}, edges: [], regions: [], seq: 0 });

export const maxIdNum = (ids: string[]): number =>
  ids.reduce((m, id) => Math.max(m, parseInt(id.replace(/\D/g, '')) || 0), 0);

/** Build fresh graph state from a serialized diagram, deriving `seq` from the highest id. */
export function fromData(data: GraphData): GraphState {
  const nodes: Record<string, GraphNode> = {};
  data.nodes.forEach((n) => { nodes[n.id] = n; });
  const ids = [...data.nodes, ...data.edges, ...data.regions].map((x) => x.id);
  const state: GraphState = { nodes, edges: data.edges, regions: data.regions, seq: maxIdNum(ids) };
  if (data.walkthrough) state.walkthrough = data.walkthrough;
  return state;
}
