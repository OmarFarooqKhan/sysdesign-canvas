import { describe, expect, it } from 'vitest';
import { graphReducer } from '../../store/graphReducer';
import { emptyGraph } from '../../store/actions';
import type { GraphState } from '../../types';

const base = (): GraphState => ({
  nodes: { n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 10, y: 20 } },
  edges: [{ id: 'e1', from: 'n1', to: 'n1x', label: '' }],
  regions: [{ id: 'r1', title: 'R', x: 5, y: 5, w: 200, h: 150, color: '#fff' }],
  seq: 1,
});

describe('graphReducer nodes', () => {
  it('adds a node and bumps seq, clamping negatives', () => {
    const s = graphReducer(emptyGraph(), { type: 'ADD_NODE', def: { key: 'db', icon: 'sql', label: 'DB' }, x: -5, y: 40 });
    expect(s.seq).toBe(1);
    expect(s.nodes.n1).toMatchObject({ id: 'n1', key: 'db', x: 0, y: 40 });
  });
  it('moves / renames a node, ignoring unknown ids', () => {
    const s = base();
    expect(graphReducer(s, { type: 'MOVE_NODE', id: 'nope', x: 1, y: 1 })).toBe(s);
    expect(graphReducer(s, { type: 'RENAME_NODE', id: 'nope', label: 'x' })).toBe(s);
    expect(graphReducer(s, { type: 'MOVE_NODE', id: 'n1', x: -9, y: 7 }).nodes.n1).toMatchObject({ x: 0, y: 7 });
    expect(graphReducer(s, { type: 'RENAME_NODE', id: 'n1', label: 'New' }).nodes.n1.label).toBe('New');
  });
  it('sets db schema on a node, ignoring unknown ids', () => {
    const s = base();
    const db = { tables: [{ name: 'orders', columns: [], indexes: [], constraints: [] }] };
    expect(graphReducer(s, { type: 'SET_NODE_DB', id: 'nope', db })).toBe(s);
    const out = graphReducer(s, { type: 'SET_NODE_DB', id: 'n1', db });
    expect(out.nodes.n1.db).toEqual(db);
    expect(s.nodes.n1.db).toBeUndefined();
  });
  it('deletes a node and its edges, ignoring unknown ids', () => {
    const s: GraphState = { ...base(), edges: [{ id: 'e1', from: 'n1', to: 'n2', label: '' }] };
    expect(graphReducer(s, { type: 'DELETE_NODE', id: 'nope' })).toBe(s);
    const out = graphReducer(s, { type: 'DELETE_NODE', id: 'n1' });
    expect(out.nodes.n1).toBeUndefined();
    expect(out.edges).toHaveLength(0);
  });
});

describe('graphReducer edges', () => {
  it('adds an edge, rejecting self-loops and duplicates', () => {
    let s = emptyGraph();
    s = graphReducer(s, { type: 'ADD_EDGE', from: 'a', to: 'b', label: 'x' });
    expect(s.edges).toHaveLength(1);
    expect(graphReducer(s, { type: 'ADD_EDGE', from: 'a', to: 'a' })).toBe(s);
    expect(graphReducer(s, { type: 'ADD_EDGE', from: 'a', to: 'b' })).toBe(s);
    expect(graphReducer(emptyGraph(), { type: 'ADD_EDGE', from: 'a', to: 'b' }).edges[0].label).toBe('');
  });
  it('labels and deletes edges', () => {
    const s = base();
    expect(graphReducer(s, { type: 'LABEL_EDGE', id: 'e1', label: 'hi' }).edges[0].label).toBe('hi');
    expect(graphReducer(s, { type: 'DELETE_EDGE', id: 'e1' }).edges).toHaveLength(0);
  });
  it('toggles an edge between one-way and bidirectional', () => {
    const s = base();
    const on = graphReducer(s, { type: 'TOGGLE_EDGE_DIRECTION', id: 'e1' });
    expect(on.edges[0].bidirectional).toBe(true);
    const off = graphReducer(on, { type: 'TOGGLE_EDGE_DIRECTION', id: 'e1' });
    expect(off.edges[0].bidirectional).toBe(false);
    expect(graphReducer(s, { type: 'TOGGLE_EDGE_DIRECTION', id: 'nope' }).edges[0].bidirectional).toBeUndefined();
  });
});

describe('graphReducer regions', () => {
  it('adds region with default + explicit fields', () => {
    const s = graphReducer(emptyGraph(), { type: 'ADD_REGION' });
    expect(s.regions[0]).toMatchObject({ id: 'r1', title: 'Region', color: '#4f8cff' });
    const s2 = graphReducer(s, { type: 'ADD_REGION', region: { title: 'B', color: '#000' } });
    expect(s2.regions[1]).toMatchObject({ title: 'B', color: '#000' });
  });
  it('moves/resizes/renames/deletes regions with clamping', () => {
    const s = base();
    expect(graphReducer(s, { type: 'MOVE_REGION', id: 'r1', x: -3, y: 8 }).regions[0]).toMatchObject({ x: 0, y: 8 });
    expect(graphReducer(s, { type: 'RESIZE_REGION', id: 'r1', w: 10, h: 10 }).regions[0]).toMatchObject({ w: 120, h: 90 });
    expect(graphReducer(s, { type: 'RENAME_REGION', id: 'r1', title: 'Z' }).regions[0].title).toBe('Z');
    expect(graphReducer(s, { type: 'DELETE_REGION', id: 'r1' }).regions).toHaveLength(0);
  });
});

describe('graphReducer branch cases (multi-element)', () => {
  it('DELETE_NODE removes edges by both source and target, keeping unrelated', () => {
    const s: GraphState = {
      ...base(),
      edges: [
        { id: 'e1', from: 'n1', to: 'n2', label: '' }, // source match
        { id: 'e2', from: 'n3', to: 'n1', label: '' }, // target match
        { id: 'e3', from: 'n3', to: 'n4', label: '' }, // unrelated
      ],
    };
    const out = graphReducer(s, { type: 'DELETE_NODE', id: 'n1' });
    expect(out.edges.map((e) => e.id)).toEqual(['e3']);
  });

  it('LABEL_EDGE only changes the matching edge', () => {
    const s: GraphState = {
      ...base(),
      edges: [{ id: 'e1', from: 'a', to: 'b', label: '' }, { id: 'e2', from: 'c', to: 'd', label: 'keep' }],
    };
    const out = graphReducer(s, { type: 'LABEL_EDGE', id: 'e1', label: 'hi' });
    expect(out.edges.map((e) => e.label)).toEqual(['hi', 'keep']);
  });

  it('region patch leaves other regions untouched', () => {
    const s: GraphState = {
      ...base(),
      regions: [
        { id: 'r1', title: 'A', x: 0, y: 0, w: 200, h: 150, color: '#000' },
        { id: 'r2', title: 'B', x: 9, y: 9, w: 200, h: 150, color: '#111' },
      ],
    };
    const out = graphReducer(s, { type: 'RENAME_REGION', id: 'r1', title: 'Z' });
    expect(out.regions.map((r) => r.title)).toEqual(['Z', 'B']);
  });
});

describe('graphReducer load/clear', () => {
  it('LOAD rebuilds state and restores seq from max id', () => {
    const out = graphReducer(emptyGraph(), {
      type: 'LOAD',
      data: {
        nodes: [{ id: 'n3', key: 'a', icon: 'a', label: 'A', x: 0, y: 0 }],
        edges: [{ id: 'e2', from: 'n3', to: 'n3', label: '' }],
        regions: [{ id: 'r5', title: 'T', x: 0, y: 0, w: 200, h: 150, color: '#fff' }],
      },
    });
    expect(out.seq).toBe(5);
    expect(out.nodes.n3).toBeDefined();
  });
  it('CLEAR resets to empty', () => {
    expect(graphReducer(base(), { type: 'CLEAR' })).toEqual(emptyGraph());
  });
});
