import { describe, expect, it } from 'vitest';
import { edgeEndpoints, insetEndpoints, nodeCenter, perpUnit } from '../../lib/geometry';
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
