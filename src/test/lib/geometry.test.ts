import { describe, expect, it } from 'vitest';
import { edgeEndpoints, edgePath, nodeCenter, portCenter } from '../../lib/geometry';
import type { GraphNode } from '../../types';

const node = (x: number, y: number): GraphNode => ({ id: 'n', key: 'k', icon: 'i', label: 'l', x, y });

describe('geometry', () => {
  it('computes port and node anchors', () => {
    expect(portCenter(node(100, 100))).toEqual({ x: 180, y: 132 });
    expect(nodeCenter(node(100, 100))).toEqual({ x: 148, y: 132 });
  });

  it('builds a curved path by default', () => {
    expect(edgePath('curved', 0, 0, 100, 50)).toContain('C');
  });

  it('builds an orthogonal path', () => {
    const d = edgePath('ortho', 0, 0, 100, 50);
    expect(d).toBe('M 0 0 L 50 0 L 50 50 L 100 50');
  });

  it('picks target side based on direction', () => {
    const forward = edgeEndpoints(node(0, 0), node(300, 0)); // source left of target
    expect(forward.tx).toBe(300 + 48 - 48); // left side
    const backward = edgeEndpoints(node(400, 0), node(0, 0)); // source right of target
    expect(backward.tx).toBe(0 + 48 + 48); // right side
  });
});
