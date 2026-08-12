import { describe, expect, it } from 'vitest';
import { nodeSnapshot, nodesInRect, offsetSnapshot, rectFromPoints, rectsIntersect } from '../../lib/selection';
import type { GraphNode } from '../../types';

const node = (x: number, y: number): GraphNode => ({ id: 'n', key: 'k', icon: 'i', label: 'l', x, y });
const idNode = (id: string, x: number, y: number): GraphNode => ({ id, key: 'k', icon: 'i', label: 'l', x, y });

describe('rectFromPoints', () => {
  it('normalizes two points regardless of drag direction', () => {
    expect(rectFromPoints(10, 10, 50, 40)).toEqual({ x: 10, y: 10, w: 40, h: 30 });
    expect(rectFromPoints(50, 40, 10, 10)).toEqual({ x: 10, y: 10, w: 40, h: 30 });
    expect(rectFromPoints(10, 40, 50, 10)).toEqual({ x: 10, y: 10, w: 40, h: 30 });
  });
});

describe('rectsIntersect', () => {
  it('detects overlap', () => {
    expect(rectsIntersect({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
  });
  it('detects non-overlap', () => {
    expect(rectsIntersect({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 20, w: 10, h: 10 })).toBe(false);
  });
  it('treats edge-touching as non-overlap', () => {
    expect(rectsIntersect({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });
});

describe('nodesInRect', () => {
  const nodes = [idNode('a', 0, 0), idNode('b', 200, 0), idNode('c', 500, 500)];
  it('returns ids of nodes whose NODE_W x NODE_H box intersects the rect', () => {
    expect(nodesInRect(nodes, { x: 0, y: 0, w: 260, h: 100 })).toEqual(['a', 'b']);
  });
  it('returns an empty array when nothing intersects', () => {
    expect(nodesInRect(nodes, { x: 900, y: 900, w: 10, h: 10 })).toEqual([]);
  });
  it('a rect fully containing a node still intersects it', () => {
    expect(nodesInRect([idNode('c', 500, 500)], { x: 0, y: 0, w: 1000, h: 1000 })).toEqual(['c']);
  });
});

describe('nodeSnapshot / offsetSnapshot', () => {
  it('snapshots the given ids from a nodes map, defaulting missing ones to 0,0', () => {
    const byId = { a: node(10, 20), b: node(30, 40) };
    expect(nodeSnapshot(byId, ['a', 'b', 'missing'])).toEqual([
      { id: 'a', x: 10, y: 20 },
      { id: 'b', x: 30, y: 40 },
      { id: 'missing', x: 0, y: 0 },
    ]);
  });
  it('offsets every entry by dx/dy, clamping to non-negative', () => {
    const snap = [{ id: 'a', x: 10, y: 10 }, { id: 'b', x: 5, y: 5 }];
    expect(offsetSnapshot(snap, 5, -8)).toEqual([
      { id: 'a', x: 15, y: 2 },
      { id: 'b', x: 10, y: 0 },
    ]);
  });
});
