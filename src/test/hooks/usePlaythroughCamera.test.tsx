import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphProvider } from '../../store/GraphContext';
import { UIProvider } from '../../store/UIContext';
import { ViewportProvider, useViewport } from '../../store/ViewportContext';
import { PlaythroughProvider, usePlaythrough } from '../../store/PlaythroughContext';
import { usePlaythroughCamera } from '../../hooks/usePlaythroughCamera';
import { fitContent } from '../../lib/viewport';
import { panToStep } from '../../lib/playthrough';
import { nodeCenter } from '../../lib/geometry';
import type { GraphState, WalkStep } from '../../types';

const steps: WalkStep[] = [{ nodeId: 'n1', text: 'a' }, { nodeId: 'n2', text: 'b' }];

const seed = (walkthrough: WalkStep[] = steps): GraphState => ({
  nodes: {
    n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 100, y: 100 },
    n2: { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 300, y: 100 },
  },
  edges: [],
  regions: [],
  seq: 2,
  walkthrough,
});

/** Nodes far enough apart that the entry fit clamps at ZOOM_MIN and content overflows
 *  the panel-adjusted viewport, so step 0 lands off-view after the raw fit and both the
 *  entry-time and per-step visibility panning kick in. */
const giantSeed = (): GraphState => ({
  nodes: {
    n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 0, y: 100 },
    n2: { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 4000, y: 100 },
  },
  edges: [],
  regions: [],
  seq: 2,
  walkthrough: steps,
});

function CameraHost() {
  usePlaythroughCamera();
  return null;
}

/** Stands in for Canvas.tsx's root div; reports an 800x600 rect to the hook. */
function CanvasStub() {
  const { canvasRef } = useViewport();
  return (
    <div
      ref={(el) => {
        canvasRef.current = el;
        if (el) {
          vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(
            { width: 800, height: 600, left: 0, top: 0 } as DOMRect,
          );
        }
      }}
    />
  );
}

function Controls() {
  const { start, stop, next } = usePlaythrough();
  const { zoom, panX, panY, setViewport } = useViewport();
  return (
    <>
      <span data-testid="viewport">{`${zoom},${panX},${panY}`}</span>
      <button onClick={start}>walk-start</button>
      <button onClick={stop}>walk-stop</button>
      <button onClick={next}>walk-next</button>
      <button onClick={() => setViewport({ zoom: 1.5, panX: 40, panY: -10 })}>set-viewport</button>
    </>
  );
}

function setup(initial: GraphState = seed(), withCanvas = true) {
  return render(
    <GraphProvider initial={initial}>
      <UIProvider>
        <ViewportProvider>
          <PlaythroughProvider>
            <Controls />
            {withCanvas && <CanvasStub />}
            <CameraHost />
          </PlaythroughProvider>
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>,
  );
}

const viewport = () => screen.getByTestId('viewport').textContent;
// Panel inset: 228px panel + 2x14px margins.
const INSET = 256;

afterEach(() => vi.restoreAllMocks());

describe('usePlaythroughCamera', () => {
  it('does nothing while not playing', () => {
    setup();
    expect(viewport()).toBe('1,0,0');
  });

  it('fits the whole diagram into the area left of the panel on start', () => {
    setup();
    fireEvent.click(screen.getByText('walk-start'));
    const fit = fitContent(seed(), 800, 600, INSET)!;
    expect(viewport()).toBe(`${fit.zoom},${fit.panX},${fit.panY}`);
  });

  it('entry fit overrides a prior zoom/pan', () => {
    setup();
    fireEvent.click(screen.getByText('set-viewport'));
    fireEvent.click(screen.getByText('walk-start'));
    const fit = fitContent(seed(), 800, 600, INSET)!;
    expect(viewport()).toBe(`${fit.zoom},${fit.panX},${fit.panY}`);
  });

  it('holds the camera on step change when the next node is already visible at the fit', () => {
    setup();
    fireEvent.click(screen.getByText('walk-start'));
    const fit = fitContent(seed(), 800, 600, INSET)!;
    fireEvent.click(screen.getByText('walk-next'));
    expect(viewport()).toBe(`${fit.zoom},${fit.panX},${fit.panY}`);
  });

  it('pans an off-view node into view on step change, holding the clamped zoom', () => {
    setup(giantSeed());
    fireEvent.click(screen.getByText('walk-start'));
    const fit = fitContent(giantSeed(), 800, 600, INSET)!;
    fireEvent.click(screen.getByText('walk-next'));
    const n2 = giantSeed().nodes.n2;
    const expected = panToStep(fit, 800, 600, nodeCenter(n2), INSET);
    expect(viewport()).toBe(`${fit.zoom},${expected.panX},${expected.panY}`);
  });

  it('entry on an oversized diagram still lands with step 0 visible', () => {
    setup(giantSeed());
    fireEvent.click(screen.getByText('walk-start'));
    const fit = fitContent(giantSeed(), 800, 600, INSET)!;
    const n1 = giantSeed().nodes.n1;
    const expected = panToStep(fit, 800, 600, nodeCenter(n1), INSET);
    expect(viewport()).toBe(`${fit.zoom},${expected.panX},${expected.panY}`);
  });

  it('restores the pre-playthrough viewport on stop', () => {
    setup();
    fireEvent.click(screen.getByText('set-viewport'));
    fireEvent.click(screen.getByText('walk-start'));
    fireEvent.click(screen.getByText('walk-next'));
    expect(viewport()).not.toBe('1.5,40,-10');
    fireEvent.click(screen.getByText('walk-stop'));
    expect(viewport()).toBe('1.5,40,-10');
  });

  it('leaves the camera alone when the canvas rect is not available', () => {
    setup(seed(), false);
    fireEvent.click(screen.getByText('walk-start'));
    expect(viewport()).toBe('1,0,0');
    fireEvent.click(screen.getByText('walk-stop'));
    expect(viewport()).toBe('1,0,0');
  });

  it('leaves the camera alone when no steps resolve', () => {
    setup(seed([{ nodeId: 'ghost', text: 'x' }]));
    fireEvent.click(screen.getByText('walk-start'));
    expect(viewport()).toBe('1,0,0');
  });
});
