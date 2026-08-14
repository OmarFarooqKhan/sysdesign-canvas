import { describe, expect, it } from 'vitest';
import { alignmentGuides, snapToGrid } from '../../lib/snap';

describe('snapToGrid', () => {
  it('rounds down to the nearest multiple of the default 8px grid', () => {
    expect(snapToGrid(3)).toBe(0);
  });
  it('rounds up to the nearest multiple of the default 8px grid', () => {
    expect(snapToGrid(5)).toBe(8);
  });
  it('leaves an already-aligned value unchanged', () => {
    expect(snapToGrid(24)).toBe(24);
  });
  it('respects a custom grid size', () => {
    expect(snapToGrid(12, 10)).toBe(10);
    expect(snapToGrid(16, 10)).toBe(20);
  });
  it('handles negative values, normalizing -0 to a plain 0', () => {
    expect(snapToGrid(-3)).toBe(0);
    expect(Object.is(snapToGrid(-3), -0)).toBe(false);
    expect(snapToGrid(-5)).toBe(-8);
  });
});

describe('alignmentGuides', () => {
  it('falls back to a pure grid snap when there are no other nodes', () => {
    expect(alignmentGuides({ x: 133, y: 127 }, [])).toEqual({ x: 136, y: 128, vertical: [], horizontal: [] });
  });

  it('falls back to grid snap when no other node is within tolerance on either axis', () => {
    const out = alignmentGuides({ x: 13, y: 13 }, [{ x: 900, y: 900 }]);
    expect(out).toEqual({ x: 16, y: 16, vertical: [], horizontal: [] });
  });

  it('matching one x-edge matches all three (same fixed node size) and reports each as a guide', () => {
    // dragged's left edge (398) is 2px from other's left edge (400); since both boxes are the
    // same NODE_W, their centers and right edges are then equally 2px apart too.
    const out = alignmentGuides({ x: 398, y: 250 }, [{ x: 400, y: 900 }]);
    expect(out.x).toBe(400);
    expect(out.vertical).toEqual([400, 448, 496]);
  });

  it('snaps a cross-pairing: dragged\'s right edge abutting another node\'s left edge', () => {
    // dragged's right edge (304+96=400) is 2px from other's left edge (402) — only this one
    // edge pair is within tolerance, so exactly one guide is reported.
    const out = alignmentGuides({ x: 304, y: 900 }, [{ x: 402, y: 900 }]);
    expect(out.x).toBe(306);
    expect(out.vertical).toEqual([402]);
  });

  it('matches at exactly the tolerance boundary (diff === tolerance)', () => {
    const out = alignmentGuides({ x: 396, y: 900 }, [{ x: 400, y: 900 }]);
    expect(out.x).toBe(400);
  });

  it('does not match just beyond the tolerance boundary, falling back to grid', () => {
    const out = alignmentGuides({ x: 395, y: 900 }, [{ x: 400, y: 900 }]);
    expect(out.x).toBe(snapToGrid(395));
  });

  it('respects a custom tolerance', () => {
    const out = alignmentGuides({ x: 390, y: 900 }, [{ x: 400, y: 900 }], 10);
    expect(out.x).toBe(400);
  });

  it('collects guides from multiple other nodes, deduping repeated coordinates', () => {
    const out = alignmentGuides(
      { x: 398, y: 900 },
      [{ x: 400, y: 900 }, { x: 400, y: 900 }, { x: 5000, y: 5000 }],
    );
    expect(out.vertical).toEqual([400, 448, 496]);
  });

  it('snaps x via alignment and y via grid independently when only x is near a neighbor', () => {
    const out = alignmentGuides({ x: 398, y: 133 }, [{ x: 400, y: 5000 }]);
    expect(out).toEqual({ x: 400, y: snapToGrid(133), vertical: [400, 448, 496], horizontal: [] });
  });

  it('matching one y-edge matches all three (top/center/bottom) and reports each as a guide', () => {
    const out = alignmentGuides({ x: 9000, y: 102 }, [{ x: 1, y: 100 }]);
    expect(out.y).toBe(100);
    expect(out.horizontal).toEqual([100, 132, 164]);
  });

  it('snaps a cross-pairing on the y axis: dragged\'s top edge abutting another\'s bottom edge', () => {
    const out = alignmentGuides({ x: 9000, y: 162 }, [{ x: 1, y: 100 }]);
    expect(out.y).toBe(164);
    expect(out.horizontal).toEqual([164]);
  });
});
