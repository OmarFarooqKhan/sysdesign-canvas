import type { GraphData, GraphState, NodeDef, Region } from '../types';

export const REGION_COLORS = ['#4f8cff', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8'];

export type GraphAction =
  | { type: 'ADD_NODE'; def: NodeDef; x: number; y: number }
  | { type: 'MOVE_NODE'; id: string; x: number; y: number }
  | { type: 'RENAME_NODE'; id: string; label: string }
  | { type: 'DELETE_NODE'; id: string }
  | { type: 'ADD_EDGE'; from: string; to: string; label?: string }
  | { type: 'LABEL_EDGE'; id: string; label: string }
  | { type: 'DELETE_EDGE'; id: string }
  | { type: 'TOGGLE_EDGE_DIRECTION'; id: string }
  | { type: 'ADD_REGION'; region?: Partial<Region> }
  | { type: 'MOVE_REGION'; id: string; x: number; y: number }
  | { type: 'RESIZE_REGION'; id: string; w: number; h: number }
  | { type: 'RENAME_REGION'; id: string; title: string }
  | { type: 'DELETE_REGION'; id: string }
  | { type: 'LOAD'; data: GraphData }
  | { type: 'CLEAR' };

const SESSION_TYPES = new Set<GraphAction['type']>(['MOVE_NODE', 'MOVE_REGION', 'RESIZE_REGION']);

/** Drag/resize actions coalesce into a single undo entry. */
export const isSessionAction = (a: GraphAction): boolean => SESSION_TYPES.has(a.type);

export const emptyGraph = (): GraphState => ({ nodes: {}, edges: [], regions: [], seq: 0 });

export const maxIdNum = (ids: string[]): number =>
  ids.reduce((m, id) => Math.max(m, parseInt(id.replace(/\D/g, '')) || 0), 0);
