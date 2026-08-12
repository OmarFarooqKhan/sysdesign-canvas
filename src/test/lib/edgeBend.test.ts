import { describe, expect, it } from 'vitest';
import { bendDelta, edgeMidpoint } from '../../lib/edgeBend';

describe('edgeBend: bendDelta', () => {
  it('projects a drag delta onto the perpendicular of a horizontal path', () => {
    // perpendicular of a horizontal segment is vertical (0,1): only dy contributes.
    expect(bendDelta(0, 0, 100, 0, 5, 7)).toBe(7);
  });

  it('projects a drag delta onto the perpendicular of a vertical path', () => {
    // perpendicular of a vertical segment is horizontal (-1,0): only -dx contributes.
    expect(bendDelta(0, 0, 0, 100, 5, 7)).toBe(-5);
  });
});

describe('edgeBend: edgeMidpoint', () => {
  it('ortho, horizontal-dominant: shifts x by bend, keeps y at the segment midpoint', () => {
    expect(edgeMidpoint('ortho', 0, 0, 100, 0, 10)).toEqual({ x: 60, y: 0 });
  });

  it('ortho, vertical-dominant: shifts y by bend, keeps x at the segment midpoint', () => {
    expect(edgeMidpoint('ortho', 0, 0, 10, 100, 5)).toEqual({ x: 5, y: 55 });
  });

  it('curved: offsets the segment midpoint along the perpendicular', () => {
    expect(edgeMidpoint('curved', 0, 0, 100, 0, 10)).toEqual({ x: 50, y: 10 });
  });

  it('defaults bend to 0, landing on the plain segment midpoint', () => {
    expect(edgeMidpoint('curved', 0, 0, 100, 50)).toEqual({ x: 50, y: 25 });
  });
});
