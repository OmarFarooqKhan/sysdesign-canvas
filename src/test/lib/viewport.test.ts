import { describe, expect, it } from 'vitest';
import {
  clampZoom, stepZoom, screenToCanvas, screenToLocal, contentBounds, fitTransform,
  fitContent, nodeVisible, ZOOM_MIN, ZOOM_MAX,
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

const seededState: GraphState = {
  nodes: {
    n1: { id: 'n1', key: 'k', icon: 'i', label: 'l', x: 10, y: 20 },
    n2: { id: 'n2', key: 'k', icon: 'i', label: 'l', x: 300, y: 150 },
  },
  edges: [],
  regions: [],
  seq: 2,
};

describe('fitContent', () => {
  it('returns null for an empty state', () => {
    expect(fitContent(emptyState, 800, 600)).toBeNull();
  });

  it('fits the content bounds into the full viewport with no inset', () => {
    expect(fitContent(seededState, 800, 600)).toEqual(fitTransform(contentBounds(seededState)!, 800, 600));
  });

  it('fits into the reduced width when an inset is given', () => {
    expect(fitContent(seededState, 800, 600, 256)).toEqual(fitTransform(contentBounds(seededState)!, 800 - 256, 600));
  });
});

describe('nodeVisible', () => {
  const vp = { zoom: 1, panX: 0, panY: 0 };
  const node = { x: 100, y: 100 };

  it('is true when the node sits fully inside the viewport', () => {
    expect(nodeVisible(vp, 800, 600, node, 0)).toBe(true);
  });

  it('is false when the node crosses the left boundary', () => {
    expect(nodeVisible(vp, 800, 600, { x: -1, y: 100 }, 0)).toBe(false);
  });

  it('is false when the node crosses the top boundary', () => {
    expect(nodeVisible(vp, 800, 600, { x: 100, y: -1 }, 0)).toBe(false);
  });

  it('is false when the node crosses the right boundary', () => {
    // node right edge = 100 + 96 = 196; viewportW = 196 puts it exactly at the edge (visible),
    // 195 pushes it 1px over.
    expect(nodeVisible(vp, 195, 600, node, 0)).toBe(false);
    expect(nodeVisible(vp, 196, 600, node, 0)).toBe(true);
  });

  it('is false when the node crosses the bottom boundary', () => {
    // node bottom edge = 100 + 64 = 164.
    expect(nodeVisible(vp, 800, 163, node, 0)).toBe(false);
    expect(nodeVisible(vp, 800, 164, node, 0)).toBe(true);
  });

  it('scales the node rect by zoom before checking bounds', () => {
    const zoomed = { zoom: 2, panX: 0, panY: 0 };
    // at zoom 2, right edge = 100*2 + 96*2 = 392; fits in 400 but not 391.
    expect(nodeVisible(zoomed, 400, 600, node, 0)).toBe(true);
    expect(nodeVisible(zoomed, 391, 600, node, 0)).toBe(false);
  });

  it('respects rightInset on the right boundary', () => {
    // node right edge = 196; with a 200px inset the usable width is 396, well clear at 800.
    expect(nodeVisible(vp, 800, 600, node, 604)).toBe(true);
    expect(nodeVisible(vp, 800, 600, node, 605)).toBe(false);
  });
});
