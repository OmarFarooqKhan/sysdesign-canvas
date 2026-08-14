import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphProvider } from '../../store/GraphContext';
import { UIProvider } from '../../store/UIContext';
import { ViewportProvider, useViewport } from '../../store/ViewportContext';
import { PlaythroughProvider, usePlaythrough } from '../../store/PlaythroughContext';
import { usePresentFit } from '../../hooks/usePresentFit';
import { fitContent } from '../../lib/viewport';
import type { GraphState, WalkStep } from '../../types';

const steps: WalkStep[] = [{ nodeId: 'n1', text: 'a' }];

const seed = (walkthrough?: WalkStep[]): GraphState => ({
  nodes: {
    n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 100, y: 100 },
    n2: { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 300, y: 100 },
  },
  edges: [],
  regions: [],
  seq: 2,
  walkthrough,
});

const emptyState: GraphState = { nodes: {}, edges: [], regions: [], seq: 0 };

function FitHost() {
  usePresentFit();
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
  const { togglePresenting, setViewport, zoom, panX, panY } = useViewport();
  const { start, stop } = usePlaythrough();
  return (
    <>
      <span data-testid="viewport">{`${zoom},${panX},${panY}`}</span>
      <button onClick={togglePresenting}>toggle-presenting</button>
      <button onClick={stop}>walk-stop</button>
      <button onClick={() => { start(); togglePresenting(); }}>start-and-present</button>
      <button onClick={() => setViewport({ zoom: 1.5, panX: 40, panY: -10 })}>mark-viewport</button>
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
            <FitHost />
          </PlaythroughProvider>
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>,
  );
}

const viewport = () => screen.getByTestId('viewport').textContent;

afterEach(() => vi.restoreAllMocks());

describe('usePresentFit', () => {
  it('fits the diagram to the full canvas on the presenting rising edge', () => {
    setup();
    fireEvent.click(screen.getByText('toggle-presenting'));
    const fit = fitContent(seed(), 800, 600)!;
    expect(viewport()).toBe(`${fit.zoom},${fit.panX},${fit.panY}`);
  });

  it('is a no-op when the canvas rect is missing', () => {
    setup(seed(), false);
    fireEvent.click(screen.getByText('toggle-presenting'));
    expect(viewport()).toBe('1,0,0');
  });

  it('is a no-op on an empty graph', () => {
    setup(emptyState);
    fireEvent.click(screen.getByText('toggle-presenting'));
    expect(viewport()).toBe('1,0,0');
  });

  it('does not fit when a playthrough starts in the same click (the camera hook owns that fit)', () => {
    setup(seed(steps));
    fireEvent.click(screen.getByText('start-and-present'));
    expect(viewport()).toBe('1,0,0');
  });

  it('does nothing on the falling edge (presenting off)', () => {
    setup();
    fireEvent.click(screen.getByText('toggle-presenting'));
    const fit = fitContent(seed(), 800, 600)!;
    expect(viewport()).toBe(`${fit.zoom},${fit.panX},${fit.panY}`);
    fireEvent.click(screen.getByText('toggle-presenting'));
    expect(viewport()).toBe(`${fit.zoom},${fit.panX},${fit.panY}`);
  });

  it('a playthrough stopping while presenting stays on does not re-fit', () => {
    setup(seed(steps));
    fireEvent.click(screen.getByText('start-and-present'));
    fireEvent.click(screen.getByText('mark-viewport'));
    expect(viewport()).toBe('1.5,40,-10');
    fireEvent.click(screen.getByText('walk-stop'));
    expect(viewport()).toBe('1.5,40,-10');
  });
});
