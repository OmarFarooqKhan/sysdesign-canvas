import { describe, expect, it } from 'vitest';
import {
  clampZoom, stepZoom, screenToCanvas, screenToLocal, contentBounds, fitTransform,
  ZOOM_MIN, ZOOM_MAX,
} from '../../lib/viewport';
import type { GraphState } from '../../types';

describe('clampZoom', () => {
  it('clamps below the minimum', () => { expect(clampZoom(0)).toBe(ZOOM_MIN); });
  it('clamps above the maximum', () => { expect(clampZoom(10)).toBe(ZOOM_MAX); });
  it('passes through in-range values', () => { expect(clampZoom(1)).toBe(1); });
});

describe('stepZoom', () => {
  it('steps up by the fixed increment', () => { expect(stepZoom(1, 1)).toBe(1.25); });
  it('steps down by the fixed increment', () => { expect(stepZoom(1, -1)).toBe(0.75); });
  it('clamps at the top', () => { expect(stepZoom(2, 1)).toBe(2); });
  it('clamps at the bottom', () => { expect(stepZoom(0.25, -1)).toBe(0.25); });
});

describe('screenToCanvas', () => {
  it('converts a client point through pan/zoom and the rect offset', () => {
    const rect = { left: 10, top: 20 } as DOMRect;
    const p = screenToCanvas(110, 220, rect, { zoom: 2, panX: 5, panY: 8 });
    // (110 - 10 - 5) / 2 = 47.5 ; (220 - 20 - 8) / 2 = 96
    expect(p).toEqual({ x: 47.5, y: 96 });
  });
});

describe('screenToLocal', () => {
  it('falls back to a raw origin-relative delta when rect is undefined', () => {
    expect(screenToLocal(150, 260, undefined, { zoom: 2, panX: 5, panY: 8 }, 100, 200)).toEqual({ x: 50, y: 60 });
  });

  it('converts through the canvas and then subtracts the origin', () => {
    const rect = { left: 0, top: 0 } as DOMRect;
    const p = screenToLocal(300, 150, rect, { zoom: 1, panX: 0, panY: 0 }, 100, 100);
    expect(p).toEqual({ x: 200, y: 50 });
  });
});

const emptyState: GraphState = { nodes: {}, edges: [], regions: [], seq: 0 };

describe('contentBounds', () => {
  it('returns null for an empty canvas', () => { expect(contentBounds(emptyState)).toBeNull(); });

  it('covers nodes and regions', () => {
    const state: GraphState = {
      nodes: { n1: { id: 'n1', key: 'k', icon: 'i', label: 'l', x: 10, y: 20 } },
      edges: [],
      regions: [{ id: 'r1', title: 't', x: 200, y: 5, w: 50, h: 40, color: '#fff' }],
      seq: 1,
    };
    expect(contentBounds(state)).toEqual({ minX: 10, minY: 5, maxX: 250, maxY: 84 });
  });
});

describe('fitTransform', () => {
  it('centers content and clamps zoom to the max', () => {
    const bounds = { minX: 10, minY: 10, maxX: 106, maxY: 74 }; // 96 x 64
    const vp = fitTransform(bounds, 800, 600);
    expect(vp.zoom).toBe(ZOOM_MAX);
    // pan centers the (scaled) content box within the viewport
    const w = 96 * vp.zoom;
    const h = 64 * vp.zoom;
    expect(vp.panX).toBeCloseTo((800 - w) / 2 - 10 * vp.zoom);
    expect(vp.panY).toBeCloseTo((600 - h) / 2 - 10 * vp.zoom);
  });

  it('clamps zoom to the minimum for very large content', () => {
    const bounds = { minX: 0, minY: 0, maxX: 100000, maxY: 100000 };
    const vp = fitTransform(bounds, 800, 600);
    expect(vp.zoom).toBe(ZOOM_MIN);
  });
});
