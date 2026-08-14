import { describe, expect, it } from 'vitest';
import { edgePath } from '../../lib/edgePath';

describe('edgePath: curved mode', () => {
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

  it('caps the control-point handle length for a long, mostly-vertical edge', () => {
    // Regression: an uncapped handle (half the 470px vertical span) shot the
    // curve far sideways before swinging back to the target, reading as a
    // loop instead of an arrow pointing at the node. Capped, the control
    // points stay within EXT_MAX (80) of their endpoint.
    const d = edgePath('curved', 800, 580, 580, 110);
    expect(d).toBe('M 800 580 C 800 500, 580 190, 580 110');
  });

  it('caps the control-point handle length for a long, mostly-horizontal edge', () => {
    const d = edgePath('curved', 0, 0, 900, 40);
    expect(d).toBe('M 0 0 C 80 0, 820 40, 900 40');
  });
});

describe('edgePath: ortho mode', () => {
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
