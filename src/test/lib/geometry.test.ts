import { describe, expect, it } from 'vitest';
import { edgeEndpoints, edgePath, insetEndpoints, nodeCenter, perpUnit } from '../../lib/geometry';
import type { GraphNode } from '../../types';

const node = (x: number, y: number): GraphNode => ({ id: 'n', key: 'k', icon: 'i', label: 'l', x, y });

describe('geometry: nodeCenter', () => {
  it('computes the center of a node box', () => {
    expect(nodeCenter(node(100, 100))).toEqual({ x: 148, y: 132 });
  });
});

describe('geometry: edgeEndpoints side pairings', () => {
  it('anchors right->left when b is directly right of a', () => {
    const a = node(0, 0);
    const b = node(400, 0);
    expect(edgeEndpoints(a, b)).toEqual({ sx: 96, sy: 32, tx: 400, ty: 32 });
  });

  it('anchors left->right when b is directly left of a', () => {
    const a = node(400, 0);
    const b = node(0, 0);
    expect(edgeEndpoints(a, b)).toEqual({ sx: 400, sy: 32, tx: 96, ty: 32 });
  });

  it('anchors bottom->top when b is directly below a', () => {
    const a = node(0, 0);
    const b = node(0, 400);
    expect(edgeEndpoints(a, b)).toEqual({ sx: 48, sy: 64, tx: 48, ty: 400 });
  });

  it('anchors top->bottom when b is directly above a', () => {
    const a = node(0, 400);
    const b = node(0, 0);
    expect(edgeEndpoints(a, b)).toEqual({ sx: 48, sy: 400, tx: 48, ty: 64 });
  });

  it('breaks ties in favor of the horizontal axis on the diagonal', () => {
    // |dx| == |dy|: horizontal wins.
    const a = node(0, 0);
    const b = node(300, 300);
    expect(edgeEndpoints(a, b)).toEqual({ sx: 96, sy: 32, tx: 300, ty: 332 });
  });
});

describe('geometry: insetEndpoints', () => {
  it('leaves the source untouched and insets only the target for a one-way edge', () => {
    const out = insetEndpoints(0, 0, 100, 0, false);
    expect(out).toEqual({ sx: 0, sy: 0, tx: 96, ty: 0 });
  });

  it('insets both ends for a bidirectional edge', () => {
    const out = insetEndpoints(0, 0, 100, 0, true);
    expect(out).toEqual({ sx: 4, sy: 0, tx: 96, ty: 0 });
  });

  it('insets along a vertical path too', () => {
    const out = insetEndpoints(0, 0, 0, 100, true);
    expect(out).toEqual({ sx: 0, sy: 4, tx: 0, ty: 96 });
  });

  it('accepts a custom gap and guards against a zero-length segment', () => {
    expect(insetEndpoints(0, 0, 100, 0, true, 10)).toEqual({ sx: 10, sy: 0, tx: 90, ty: 0 });
    expect(insetEndpoints(5, 5, 5, 5, true)).toEqual({ sx: 5, sy: 5, tx: 5, ty: 5 });
  });
});

describe('geometry: perpUnit', () => {
  it('is perpendicular to a horizontal segment', () => {
    expect(perpUnit(0, 0, 100, 0)).toEqual({ x: 0, y: 1 });
  });

  it('is perpendicular to a vertical segment', () => {
    expect(perpUnit(0, 0, 0, 100)).toEqual({ x: -1, y: 0 });
  });

  it('guards against a zero-length segment', () => {
    expect(perpUnit(5, 5, 5, 5)).toEqual({ x: 0, y: 0 });
  });
});

describe('geometry: edgePath curved mode', () => {
  it('builds a horizontal-dominant curve', () => {
    const d = edgePath('curved', 0, 0, 100, 50);
    expect(d).toBe('M 0 0 C 70 0, 30 50, 100 50');
  });

  it('builds a vertical-dominant curve for top/bottom anchors', () => {
    const d = edgePath('curved', 0, 0, 20, 100);
    expect(d).toBe('M 0 0 C 0 70, 20 30, 20 100');
  });

  it('bows a horizontal-dominant curve by its perpendicular bend', () => {
    const d = edgePath('curved', 0, 0, 100, 0, 20);
    // perpendicular of a horizontal segment is vertical: bx=0, by=bend
    expect(d).toBe('M 0 0 C 70 20, 30 20, 100 0');
  });

  it('bows a vertical-dominant curve by its perpendicular bend', () => {
    const d = edgePath('curved', 0, 0, 0, 100, 20);
    // perpendicular of a vertical segment is horizontal: bx=-bend, by=0
    expect(d).toBe('M 0 0 C -20 70, -20 30, 0 100');
  });

  it('keeps control points between the endpoints when the target is behind the source (dx < 0)', () => {
    // Regression: an unsigned extension here used to push both control points
    // outward past the endpoints, flipping the arrival tangent and making the
    // arrowhead marker (auto-start-reverse) point away from the target.
    const d = edgePath('curved', 100, 0, 0, 50);
    expect(d).toBe('M 100 0 C 30 0, 70 50, 0 50');
  });

  it('keeps control points between the endpoints when the target is above the source (dy < 0)', () => {
    const d = edgePath('curved', 0, 100, 20, 0);
    expect(d).toBe('M 0 100 C 0 30, 20 70, 20 0');
  });

  it('falls back to a fixed small loop when source and target exactly coincide', () => {
    const d = edgePath('curved', 0, 0, 0, 0);
    expect(d).toBe('M 0 0 C 20 0, -20 0, 0 0');
  });
});

describe('geometry: edgePath ortho mode', () => {
  it('builds a horizontal-dominant elbow route', () => {
    const d = edgePath('ortho', 0, 0, 100, 50);
    expect(d).toBe('M 0 0 L 50 0 L 50 50 L 100 50');
  });

  it('builds a vertical-dominant elbow route for top/bottom anchors', () => {
    const d = edgePath('ortho', 0, 0, 20, 100);
    expect(d).toBe('M 0 0 L 0 50 L 20 50 L 20 100');
  });

  it('shifts the horizontal-dominant elbow by the bend', () => {
    const d = edgePath('ortho', 0, 0, 100, 50, 15);
    expect(d).toBe('M 0 0 L 65 0 L 65 50 L 100 50');
  });

  it('shifts the vertical-dominant elbow by the bend', () => {
    const d = edgePath('ortho', 0, 0, 20, 100, 15);
    expect(d).toBe('M 0 0 L 0 65 L 20 65 L 20 100');
  });
});
