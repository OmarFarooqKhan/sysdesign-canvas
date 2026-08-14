import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphProvider } from '../../store/GraphContext';
import { UIProvider } from '../../store/UIContext';
import { ViewportProvider, useViewport } from '../../store/ViewportContext';
import { PlaythroughProvider, usePlaythrough } from '../../store/PlaythroughContext';
import { usePlaythroughCamera } from '../../hooks/usePlaythroughCamera';
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

afterEach(() => vi.restoreAllMocks());

// The visible area left of the 228px panel + its 2x14px margins in an 800px-wide
// canvas centers on x = (800 - 256) / 2 = 272; vertical center is 300.
// n1's center is (148, 132), n2's is (348, 132).
describe('usePlaythroughCamera', () => {
  it('does nothing while not playing', () => {
    setup();
    expect(viewport()).toBe('1,0,0');
  });

  it('pans the step-0 node into the area left of the panel on start, leaving zoom alone', () => {
    setup();
    fireEvent.click(screen.getByText('walk-start'));
    expect(viewport()).toBe(`1,${272 - 148},${300 - 132}`);
  });

  it('pans again on every step change', () => {
    setup();
    fireEvent.click(screen.getByText('walk-start'));
    fireEvent.click(screen.getByText('walk-next'));
    expect(viewport()).toBe(`1,${272 - 348},${300 - 132}`);
  });

  it('accounts for the current zoom when panning', () => {
    setup();
    fireEvent.click(screen.getByText('set-viewport'));
    fireEvent.click(screen.getByText('walk-start'));
    expect(viewport()).toBe(`1.5,${272 - 148 * 1.5},${300 - 132 * 1.5}`);
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
