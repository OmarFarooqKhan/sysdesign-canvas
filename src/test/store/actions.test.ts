import { describe, expect, it } from 'vitest';
import { emptyGraph, fromData, isSessionAction, maxIdNum } from '../../store/actions';

describe('action helpers', () => {
  it('emptyGraph is a fresh zeroed graph', () => {
    expect(emptyGraph()).toEqual({ nodes: {}, edges: [], regions: [], seq: 0 });
  });

  it('isSessionAction flags only drag/resize actions', () => {
    expect(isSessionAction({ type: 'MOVE_NODE', id: 'n1', x: 0, y: 0 })).toBe(true);
    expect(isSessionAction({ type: 'MOVE_NODES', moves: [{ id: 'n1', x: 0, y: 0 }] })).toBe(true);
    expect(isSessionAction({ type: 'MOVE_REGION', id: 'r1', x: 0, y: 0 })).toBe(true);
    expect(isSessionAction({ type: 'RESIZE_REGION', id: 'r1', w: 1, h: 1 })).toBe(true);
    expect(isSessionAction({ type: 'BEND_EDGE', id: 'e1', bend: 1 })).toBe(true);
    expect(isSessionAction({ type: 'CLEAR' })).toBe(false);
    expect(isSessionAction({ type: 'SET_NODE_DB', id: 'n1', db: { tables: [] } })).toBe(false);
  });

  it('maxIdNum finds the largest embedded number, ignoring non-numeric', () => {
    expect(maxIdNum(['n1', 'e12', 'r3'])).toBe(12);
    expect(maxIdNum([])).toBe(0);
    expect(maxIdNum(['abc'])).toBe(0);
  });

  it('fromData rebuilds graph state and restores seq from the highest id', () => {
    const out = fromData({
      nodes: [{ id: 'n3', key: 'a', icon: 'a', label: 'A', x: 0, y: 0 }],
      edges: [{ id: 'e2', from: 'n3', to: 'n3', label: '' }],
      regions: [{ id: 'r5', title: 'T', x: 0, y: 0, w: 200, h: 150, color: '#fff' }],
    });
    expect(out.seq).toBe(5);
    expect(out.nodes.n3).toBeDefined();
    expect(out.edges).toHaveLength(1);
    expect(out.regions).toHaveLength(1);
  });

  it('fromData on an empty diagram yields an empty (zero-seq) state', () => {
    expect(fromData({ nodes: [], edges: [], regions: [] })).toEqual(emptyGraph());
  });
});
