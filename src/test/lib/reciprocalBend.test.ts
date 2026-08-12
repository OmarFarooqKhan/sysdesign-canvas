import { describe, it, expect } from 'vitest';
import { autoBend } from '../../lib/reciprocalBend';
import type { Edge, GraphNode } from '../../types';

const near: GraphNode = { id: 'a', key: 'server', icon: 'server', label: 'A', x: 0, y: 0 };
const far: GraphNode = { id: 'b', key: 'server', icon: 'server', label: 'B', x: 800, y: 0 };
const ab: Edge = { id: 'e1', from: 'a', to: 'b', label: '' };
const ba: Edge = { id: 'e2', from: 'b', to: 'a', label: '' };

describe('autoBend', () => {
  it('is zero when the edge has no reciprocal', () => {
    expect(autoBend([ab], ab, near, far)).toBe(0);
  });

  it('is zero for a single edge among unrelated others', () => {
    const other: Edge = { id: 'e3', from: 'a', to: 'c', label: '' };
    expect(autoBend([ab, other], ab, near, far)).toBe(0);
  });

  it('bows both sides of a reciprocal pair by the same amount', () => {
    // Equal (not opposite) signed bends are correct here: the reciprocal edge's
    // endpoints are already the swap of this edge's, which inverts the
    // perpendicular bow direction on its own — see the comment in reciprocalBend.ts.
    const bendAB = autoBend([ab, ba], ab, near, far);
    const bendBA = autoBend([ab, ba], ba, far, near);
    expect(bendAB).toBeGreaterThan(0);
    expect(bendAB).toBe(bendBA);
  });

  it('shrinks toward zero for nodes close together, instead of a fixed minimum', () => {
    const close: GraphNode = { id: 'c', key: 'server', icon: 'server', label: 'C', x: 10, y: 0 };
    expect(autoBend([ab, ba], ab, near, close)).toBeCloseTo(10 * 0.18, 5);
  });

  it('is zero for overlapping nodes', () => {
    expect(autoBend([ab, ba], ab, near, near)).toBe(0);
  });

  it('clamps to a maximum for nodes far apart', () => {
    const veryFar: GraphNode = { id: 'd', key: 'server', icon: 'server', label: 'D', x: 5000, y: 0 };
    expect(autoBend([ab, ba], ab, near, veryFar)).toBe(42);
  });

  it('scales with distance between the clamps', () => {
    const mid: GraphNode = { id: 'e', key: 'server', icon: 'server', label: 'E', x: 200, y: 0 };
    expect(autoBend([ab, ba], ab, near, mid)).toBeCloseTo(200 * 0.18, 5);
  });
});
