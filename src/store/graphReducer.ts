import type { GraphNode, GraphState, Region } from '../types';
import { type GraphAction, REGION_COLORS, emptyGraph, maxIdNum } from './actions';

export function graphReducer(s: GraphState, a: GraphAction): GraphState {
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
    case 'DELETE_NODE': {
      if (!s.nodes[a.id]) return s;
      const nodes = { ...s.nodes };
      delete nodes[a.id];
      return { ...s, nodes, edges: s.edges.filter((e) => e.from !== a.id && e.to !== a.id) };
    }
    case 'ADD_EDGE': {
      if (a.from === a.to || s.edges.some((e) => e.from === a.from && e.to === a.to)) return s;
      const seq = s.seq + 1;
      return { ...s, edges: [...s.edges, { id: `e${seq}`, from: a.from, to: a.to, label: a.label ?? '' }], seq };
    }
    case 'LABEL_EDGE':
      return { ...s, edges: s.edges.map((e) => (e.id === a.id ? { ...e, label: a.label } : e)) };
    case 'DELETE_EDGE':
      return { ...s, edges: s.edges.filter((e) => e.id !== a.id) };
    case 'TOGGLE_EDGE_DIRECTION':
      return { ...s, edges: s.edges.map((e) => (e.id === a.id ? { ...e, bidirectional: !e.bidirectional } : e)) };
    case 'ADD_REGION': {
      const seq = s.seq + 1;
      const r = a.region ?? {};
      const region: Region = {
        id: `r${seq}`, title: r.title ?? 'Region', x: r.x ?? 80, y: r.y ?? 80, w: r.w ?? 260,
        h: r.h ?? 180, color: r.color ?? REGION_COLORS[s.regions.length % REGION_COLORS.length],
      };
      return { ...s, regions: [...s.regions, region], seq };
    }
    case 'MOVE_REGION':
      return { ...s, regions: patch(s, a.id, { x: Math.max(0, a.x), y: Math.max(0, a.y) }) };
    case 'RESIZE_REGION':
      return { ...s, regions: patch(s, a.id, { w: Math.max(120, a.w), h: Math.max(90, a.h) }) };
    case 'RENAME_REGION':
      return { ...s, regions: patch(s, a.id, { title: a.title }) };
    case 'DELETE_REGION':
      return { ...s, regions: s.regions.filter((r) => r.id !== a.id) };
    case 'LOAD': {
      const nodes: Record<string, GraphNode> = {};
      a.data.nodes.forEach((n) => { nodes[n.id] = n; });
      const ids = [...a.data.nodes, ...a.data.edges, ...a.data.regions].map((x) => x.id);
      return { nodes, edges: a.data.edges, regions: a.data.regions, seq: maxIdNum(ids) };
    }
    case 'CLEAR':
      return emptyGraph();
  }
}

const patch = (s: GraphState, id: string, fields: Partial<Region>): Region[] =>
  s.regions.map((r) => (r.id === id ? { ...r, ...fields } : r));
