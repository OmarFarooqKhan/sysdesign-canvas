import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportPng } from '../../lib/exportPng';
import type { GraphState } from '../../types';

const { toPngMock } = vi.hoisted(() => ({ toPngMock: vi.fn() }));
vi.mock('html-to-image', () => ({ toPng: toPngMock }));

const state: GraphState = {
  nodes: { n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 10, y: 20 } },
  edges: [],
  regions: [],
  seq: 1,
};

function canvasWithInner(): HTMLElement {
  const canvas = document.createElement('div');
  canvas.appendChild(document.createElement('div')).className = 'canvas-inner';
  return canvas;
}

afterEach(() => vi.restoreAllMocks());

describe('exportPng', () => {
  it('is a no-op when the canvas is empty (no bounds)', async () => {
    await exportPng({ nodes: {}, edges: [], regions: [], seq: 0 }, canvasWithInner());
    expect(toPngMock).not.toHaveBeenCalled();
  });

  it('is a no-op when there is no canvas element', async () => {
    await exportPng(state, null);
    expect(toPngMock).not.toHaveBeenCalled();
  });

  it('is a no-op when the canvas has no .canvas-inner child', async () => {
    await exportPng(state, document.createElement('div'));
    expect(toPngMock).not.toHaveBeenCalled();
  });

  it('rasterizes the content-bounded .canvas-inner and downloads it', async () => {
    toPngMock.mockResolvedValue('data:image/png;base64,xxx');
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const canvas = canvasWithInner();

    await exportPng(state, canvas, 'diagram.png');

    expect(toPngMock).toHaveBeenCalledTimes(1);
    const [inner, opts] = toPngMock.mock.calls[0];
    expect(inner.className).toBe('canvas-inner');
    // node spans x:[10,106] y:[20,84] (NODE_W=96, NODE_H=64) + 40px padding each side.
    expect(opts.width).toBe(96 + 80);
    expect(opts.height).toBe(64 + 80);
    expect(opts.style.transform).toBe('translate(30px, 20px)');
    expect(click).toHaveBeenCalledTimes(1);
  });
});
