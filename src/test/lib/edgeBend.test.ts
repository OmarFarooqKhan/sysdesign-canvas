import { describe, expect, it } from 'vitest';
import { bendDelta, bowEndpoints, edgeMidpoint } from '../../lib/edgeBend';

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

describe('edgeBend: bowEndpoints', () => {
  it('leaves the endpoints untouched when bend is 0', () => {
    expect(bowEndpoints(0, 0, 100, 0, 0)).toEqual({ sx: 0, sy: 0, tx: 100, ty: 0 });
  });

  it('nudges both endpoints along the perpendicular by a fraction of bend', () => {
    // perpendicular of a horizontal segment is (0,1); offset = 20 * 0.35 = 7
    expect(bowEndpoints(0, 0, 100, 0, 20)).toEqual({ sx: 0, sy: 7, tx: 100, ty: 7 });
  });

  it('offsets a vertical segment along its own perpendicular', () => {
    // perpendicular of a vertical segment is (-1,0); offset = 20 * 0.35 = 7
    expect(bowEndpoints(0, 0, 0, 100, 20)).toEqual({ sx: -7, sy: 0, tx: -7, ty: 100 });
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
