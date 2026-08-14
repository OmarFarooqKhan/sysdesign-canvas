import type { GraphNode, GraphState } from '../types';
import type { GraphAction } from './actions';

export type NodeAction = Extract<GraphAction,
  { type: 'ADD_NODE' | 'MOVE_NODE' | 'MOVE_NODES' | 'RENAME_NODE' | 'SET_NODE_DB' | 'SET_NODE_NOTES' | 'DELETE_NODE' }>;

/** Handles the node-shaped subset of graph actions; split out of graphReducer.ts to stay under the line cap. */
export function nodeReducer(s: GraphState, a: NodeAction): GraphState {
  switch (a.type) {
    case 'ADD_NODE': {
      const seq = s.seq + 1;
      const id = `n${seq}`;
      const node: GraphNode = { id, ...a.def, x: Math.max(0, a.x), y: Math.max(0, a.y) };
      return { ...s, nodes: { ...s.nodes, [id]: node }, seq };
    }
    case 'MOVE_NODE': {
      const n = s.nodes[a.id];
      if (!n) return s;
      return { ...s, nodes: { ...s.nodes, [a.id]: { ...n, x: Math.max(0, a.x), y: Math.max(0, a.y) } } };
    }
    case 'MOVE_NODES': {
      const nodes = { ...s.nodes };
      for (const m of a.moves) {
        const n = nodes[m.id];
        if (n) nodes[m.id] = { ...n, x: Math.max(0, m.x), y: Math.max(0, m.y) };
      }
      return { ...s, nodes };
    }
    case 'RENAME_NODE': {
      const n = s.nodes[a.id];
      if (!n) return s;
      return { ...s, nodes: { ...s.nodes, [a.id]: { ...n, label: a.label } } };
    }
    case 'SET_NODE_DB': {
      const n = s.nodes[a.id];
      if (!n) return s;
      return { ...s, nodes: { ...s.nodes, [a.id]: { ...n, db: a.db } } };
    }
    case 'SET_NODE_NOTES': {
      const n = s.nodes[a.id];
      if (!n) return s;
      const updated: GraphNode = { ...n };
      if (a.notes) updated.notes = a.notes; else delete updated.notes;
      return { ...s, nodes: { ...s.nodes, [a.id]: updated } };
    }
    case 'DELETE_NODE': {
      if (!s.nodes[a.id]) return s;
      const nodes = { ...s.nodes };
      delete nodes[a.id];
      return { ...s, nodes, edges: s.edges.filter((e) => e.from !== a.id && e.to !== a.id) };
    }
  }
}
