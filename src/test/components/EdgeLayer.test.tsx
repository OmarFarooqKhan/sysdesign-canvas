import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, act, screen } from '@testing-library/react';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import { UIProvider } from '../../store/UIContext';
import { ViewportProvider, useViewport } from '../../store/ViewportContext';
import { PlaythroughProvider, usePlaythrough } from '../../store/PlaythroughContext';
import { EdgeLayer } from '../../components/EdgeLayer';
import type { GraphState } from '../../types';

function seed(): GraphState {
  return {
    nodes: {
      n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 100, y: 100 },
      n2: { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 300, y: 100 },
    },
    edges: [{ id: 'e1', from: 'n1', to: 'n2', label: 'calls' }],
    regions: [],
    seq: 3,
  };
}

let probeState: GraphState | null = null;
let probeDispatch: ReturnType<typeof useGraph>['dispatch'] | null = null;
function Probe() {
  const graph = useGraph();
  probeState = graph.state;
  probeDispatch = graph.dispatch;
  return null;
}

/** Stands in for Canvas.tsx's root div, which owns the canvasRef the menu portals into. */
function CanvasStub({ children }: { children: React.ReactNode }) {
  const { canvasRef } = useViewport();
  return <div className="canvas" ref={canvasRef}>{children}</div>;
}

/** Test-only playthrough controls (the toolbar button lives elsewhere). */
function WalkControls() {
  const { start, next } = usePlaythrough();
  return (
    <>
      <button onClick={start}>walk-start</button>
      <button onClick={next}>walk-next</button>
    </>
  );
}

function renderLayer(initial: GraphState) {
  return render(
    <GraphProvider initial={initial}>
      <UIProvider>
        <ViewportProvider>
          <PlaythroughProvider>
            <Probe />
            <WalkControls />
            <CanvasStub>
              <EdgeLayer />
            </CanvasStub>
          </PlaythroughProvider>
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('EdgeLayer', () => {
  it('renders the arrow marker and one edge for valid endpoints', () => {
    const { container } = renderLayer(seed());
    expect(container.querySelector('marker#arrow')).toBeTruthy();
    expect(container.querySelectorAll('path.edge').length).toBe(1);
  });

  it('bows a reciprocal pair of edges apart instead of overlapping', () => {
    const initial = seed();
    initial.edges.push({ id: 'e2', from: 'n2', to: 'n1', label: 'replies' });
    const { container } = renderLayer(initial);
    const [d1, d2] = Array.from(container.querySelectorAll('path.edge')).map((p) => p.getAttribute('d'));
    expect(d1).not.toBe(d2);
  });

  it('skips edges whose endpoints are missing', () => {
    const initial = seed();
    initial.edges.push({ id: 'e2', from: 'n1', to: 'missing', label: '' });
    const { container } = renderLayer(initial);
    expect(container.querySelectorAll('path.edge').length).toBe(1);
  });

  it('opens a context menu on edge click', () => {
    const { container } = renderLayer(seed());
    const path = container.querySelector('path.edge')!;
    fireEvent.click(path);
    expect(document.querySelector('.ctx')).toBeTruthy();
  });

  it('portals the menu onto the (unscaled) canvas root, not inside the zoomed edge svg', () => {
    const { container } = renderLayer(seed());
    fireEvent.click(container.querySelector('path.edge')!);
    const menu = document.querySelector('.ctx')!;
    expect(menu.closest('svg.edges')).toBeNull();
    expect(menu.parentElement).toHaveClass('canvas');
  });

  it('labels the edge via the Label edge menu item using window.prompt', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('renamed  ');
    const { container } = renderLayer(seed());
    fireEvent.click(container.querySelector('path.edge')!);
    const labelBtn = Array.from(document.querySelectorAll('.ctx button')).find((b) =>
      b.textContent?.includes('Label edge'),
    )!;
    fireEvent.click(labelBtn);
    expect(probeState!.edges[0].label).toBe('renamed');
  });

  it('does not change the label when prompt is cancelled', () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    const { container } = renderLayer(seed());
    fireEvent.click(container.querySelector('path.edge')!);
    const labelBtn = Array.from(document.querySelectorAll('.ctx button')).find((b) =>
      b.textContent?.includes('Label edge'),
    )!;
    fireEvent.click(labelBtn);
    expect(probeState!.edges[0].label).toBe('calls');
  });

  it('toggles an edge to bidirectional and back via the menu item', () => {
    const { container } = renderLayer(seed());
    fireEvent.click(container.querySelector('path.edge')!);
    const toggleOn = Array.from(document.querySelectorAll('.ctx button')).find((b) =>
      b.textContent?.includes('Bidirectional'),
    )!;
    fireEvent.click(toggleOn);
    expect(probeState!.edges[0].bidirectional).toBe(true);

    fireEvent.click(container.querySelector('path.edge')!);
    const toggleOff = Array.from(document.querySelectorAll('.ctx button')).find((b) =>
      b.textContent?.includes('One-way'),
    )!;
    fireEvent.click(toggleOff);
    expect(probeState!.edges[0].bidirectional).toBe(false);
  });

  it('keeps the edge highlighted as selected after the menu closes', () => {
    const { container } = renderLayer(seed());
    const path = container.querySelector('path.edge')!;
    fireEvent.click(path);
    expect(path.getAttribute('stroke')).toBe('#4f8cff');
    fireEvent.click(document.body);
    expect(document.querySelector('.ctx')).toBeFalsy();
    expect(path.getAttribute('stroke')).toBe('#4f8cff');
  });

  it('deletes the edge via the Delete edge menu item', () => {
    const { container } = renderLayer(seed());
    fireEvent.click(container.querySelector('path.edge')!);
    const delBtn = Array.from(document.querySelectorAll('.ctx button')).find((b) =>
      b.textContent?.includes('Delete edge'),
    )!;
    expect(delBtn).toHaveClass('danger');
    fireEvent.click(delBtn);
    expect(probeState!.edges.length).toBe(0);
  });

  it('closes the menu when its edge is deleted some other way (e.g. the Delete key)', () => {
    const { container } = renderLayer(seed());
    fireEvent.click(container.querySelector('path.edge')!);
    expect(document.querySelector('.ctx')).toBeTruthy();

    // Mirrors useKeyboard's DELETE_EDGE dispatch, which bypasses the menu's own onClose.
    act(() => probeDispatch!({ type: 'DELETE_EDGE', id: 'e1' }));
    expect(document.querySelector('.ctx')).toBeFalsy();
  });

  it('closes the menu on outside click', () => {
    const { container } = renderLayer(seed());
    fireEvent.click(container.querySelector('path.edge')!);
    expect(document.querySelector('.ctx')).toBeTruthy();
    fireEvent.click(document.body);
    expect(document.querySelector('.ctx')).toBeFalsy();
  });
});

describe('EdgeLayer playthrough hop highlight (P4)', () => {
  const walkSeed = (): GraphState => ({
    ...seed(),
    edges: [
      { id: 'e1', from: 'n1', to: 'n2', label: 'calls' },
      { id: 'e2', from: 'n2', to: 'n3', label: 'reads' },
    ],
    nodes: {
      ...seed().nodes,
      n3: { id: 'n3', key: 'cache', icon: 'cache', label: 'Cache', x: 500, y: 100 },
    },
    walkthrough: [{ nodeId: 'n1', text: 'a' }, { nodeId: 'n2', text: 'b' }, { nodeId: 'n3', text: 'c' }],
  });

  it('flags no edge while not playing, or at step 0 (no hop yet)', () => {
    const { container } = renderLayer(walkSeed());
    expect(container.querySelector('g.walk-active')).toBeNull();
    fireEvent.click(screen.getByText('walk-start'));
    expect(container.querySelector('g.walk-active')).toBeNull();
  });

  it('flags exactly the current hop edge as steps advance', () => {
    const { container } = renderLayer(walkSeed());
    fireEvent.click(screen.getByText('walk-start'));
    fireEvent.click(screen.getByText('walk-next'));
    let active = container.querySelectorAll('g.walk-active');
    expect(active).toHaveLength(1);
    expect(active[0].querySelector('path.edge')!.getAttribute('stroke')).toBe('#4f8cff');
    expect(active[0].querySelector('text.edge-label')!.textContent).toBe('calls');
    fireEvent.click(screen.getByText('walk-next'));
    active = container.querySelectorAll('g.walk-active');
    expect(active).toHaveLength(1);
    expect(active[0].querySelector('text.edge-label')!.textContent).toBe('reads');
  });

  it('flags nothing when the hop has no connecting edge (straight-line fallback)', () => {
    const initial = walkSeed();
    initial.edges = [initial.edges[1]]; // n1 -> n2 now has no edge
    const { container } = renderLayer(initial);
    fireEvent.click(screen.getByText('walk-start'));
    fireEvent.click(screen.getByText('walk-next'));
    expect(container.querySelector('g.walk-active')).toBeNull();
  });
});
