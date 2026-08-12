import { describe, expect, it } from 'vitest';
import { emptyGraph, isSessionAction, maxIdNum } from '../../store/actions';

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
  });

  it('maxIdNum finds the largest embedded number, ignoring non-numeric', () => {
    expect(maxIdNum(['n1', 'e12', 'r3'])).toBe(12);
    expect(maxIdNum([])).toBe(0);
    expect(maxIdNum(['abc'])).toBe(0);
  });
});
