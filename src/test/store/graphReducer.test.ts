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

const withTwoNodes = (): GraphState => ({
  ...base(),
  nodes: {
    n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 10, y: 20 },
    n2: { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 100, y: 200 },
  },
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
  it('MOVE_NODES moves every listed node, clamping negatives, ignoring unknown ids', () => {
    const s = withTwoNodes();
    const out = graphReducer(s, {
      type: 'MOVE_NODES',
      moves: [{ id: 'n1', x: -5, y: 30 }, { id: 'n2', x: 150, y: 250 }, { id: 'nope', x: 1, y: 1 }],
    });
    expect(out.nodes.n1).toMatchObject({ x: 0, y: 30 });
    expect(out.nodes.n2).toMatchObject({ x: 150, y: 250 });
    expect(Object.keys(out.nodes)).toEqual(['n1', 'n2']);
  });
  it('sets db schema on a node, ignoring unknown ids', () => {
    const s = base();
    const db = { tables: [{ name: 'orders', columns: [], indexes: [], constraints: [] }] };
    expect(graphReducer(s, { type: 'SET_NODE_DB', id: 'nope', db })).toBe(s);
    const out = graphReducer(s, { type: 'SET_NODE_DB', id: 'n1', db });
    expect(out.nodes.n1.db).toEqual(db);
    expect(s.nodes.n1.db).toBeUndefined();
  });
  it('sets, updates, and clears node notes; ignores unknown ids', () => {
    const s = base();
    expect(graphReducer(s, { type: 'SET_NODE_NOTES', id: 'nope', notes: 'x' })).toBe(s);
    const withNotes = graphReducer(s, { type: 'SET_NODE_NOTES', id: 'n1', notes: '~10k QPS' });
    expect(withNotes.nodes.n1.notes).toBe('~10k QPS');
    expect(s.nodes.n1.notes).toBeUndefined();
    const updated = graphReducer(withNotes, { type: 'SET_NODE_NOTES', id: 'n1', notes: 'revised' });
    expect(updated.nodes.n1.notes).toBe('revised');
    const cleared = graphReducer(updated, { type: 'SET_NODE_NOTES', id: 'n1', notes: '' });
    expect(cleared.nodes.n1.notes).toBeUndefined();
    expect('notes' in cleared.nodes.n1).toBe(false);
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
  it('sets the bend on the matching edge only, leaving others untouched', () => {
    const s: GraphState = {
      ...base(),
      edges: [{ id: 'e1', from: 'a', to: 'b', label: '' }, { id: 'e2', from: 'c', to: 'd', label: '' }],
    };
    const out = graphReducer(s, { type: 'BEND_EDGE', id: 'e1', bend: 25 });
    expect(out.edges.map((e) => e.bend)).toEqual([25, undefined]);
    expect(graphReducer(s, { type: 'BEND_EDGE', id: 'nope', bend: 5 }).edges[0].bend).toBeUndefined();
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

describe('graphReducer ADD_ITEMS (copy/paste/duplicate)', () => {
  it('inserts nodes with fresh ids and remaps internal edge endpoints, bumping seq once', () => {
    const s = base(); // seq: 1
    const out = graphReducer(s, {
      type: 'ADD_ITEMS',
      nodes: [
        { id: 'old1', key: 'server', icon: 'server', label: 'A', x: 10, y: 10 },
        { id: 'old2', key: 'sql', icon: 'sql', label: 'B', x: 20, y: 20 },
      ],
      edges: [{ id: 'oldE', from: 'old1', to: 'old2', label: 'x' }],
    });
    expect(out.seq).toBe(4); // 1 + 2 nodes + 1 edge
    expect(Object.keys(out.nodes)).toEqual(['n1', 'n2', 'n3']);
    expect(out.nodes.n2).toMatchObject({ id: 'n2', label: 'A', x: 10, y: 10 });
    expect(out.nodes.n3).toMatchObject({ id: 'n3', label: 'B', x: 20, y: 20 });
    expect(out.edges).toHaveLength(2); // the original e1 plus the newly inserted one
    expect(out.edges[1]).toMatchObject({ id: 'e4', from: 'n2', to: 'n3', label: 'x' });
  });

  it('clamps pasted node positions to non-negative', () => {
    const out = graphReducer(emptyGraph(), {
      type: 'ADD_ITEMS',
      nodes: [{ id: 'old', key: 'server', icon: 'server', label: 'A', x: -5, y: -9 }],
      edges: [],
    });
    expect(out.nodes.n1).toMatchObject({ x: 0, y: 0 });
  });

  it('inserting only nodes (no edges) leaves the existing edge list untouched', () => {
    const s = base();
    const out = graphReducer(s, {
      type: 'ADD_ITEMS',
      nodes: [{ id: 'old', key: 'server', icon: 'server', label: 'A', x: 0, y: 0 }],
      edges: [],
    });
    expect(out.edges).toEqual(s.edges);
    expect(out.seq).toBe(2);
  });
});
