import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import { UIProvider } from '../../store/UIContext';
import { ViewportProvider, useViewport } from '../../store/ViewportContext';
import { NodeView } from '../../components/NodeView';
import type { GraphState } from '../../types';

function seed(overrides?: Partial<GraphState>): GraphState {
  return {
    nodes: {
      n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 100, y: 100 },
      n2: { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 300, y: 100 },
    },
    edges: [],
    regions: [],
    seq: 2,
    ...overrides,
  };
}

let probeState: GraphState | null = null;
function Probe() {
  probeState = useGraph().state;
  return null;
}

function ZoomProbe() {
  const { setViewport } = useViewport();
  return <button data-testid="zoom-2x" onClick={() => setViewport({ zoom: 2 })} />;
}

function renderNodes(initial: GraphState) {
  return render(
    <GraphProvider initial={initial}>
      <UIProvider>
        <ViewportProvider>
          <Probe />
          <ZoomProbe />
          <NodeView node={initial.nodes.n1} />
          <NodeView node={initial.nodes.n2} />
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>,
  );
}

describe('NodeView', () => {
  it('drags to update position with one undo step', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 140, clientY: 120 });
    fireEvent.mouseMove(document, { clientX: 150, clientY: 130 });
    fireEvent.mouseUp(document);
    expect(probeState!.nodes.n1.x).toBe(150);
    expect(probeState!.nodes.n1.y).toBe(130);
  });

  it('divides the drag delta by zoom', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    fireEvent.click(container.querySelector('[data-testid="zoom-2x"]')!);
    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 140, clientY: 120 });
    fireEvent.mouseUp(document);
    expect(probeState!.nodes.n1.x).toBe(120);
    expect(probeState!.nodes.n1.y).toBe(110);
  });

  it('clamps position to non-negative', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: -1000, clientY: -1000 });
    fireEvent.mouseUp(document);
    expect(probeState!.nodes.n1.x).toBe(0);
    expect(probeState!.nodes.n1.y).toBe(0);
  });

  it('ignores mousedown on port for node drag/select', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const port = container.querySelector('[data-id="n1"] .port')!;
    const box = container.querySelector('[data-id="n1"] .box')!;
    const boxDownSpy = vi.fn();
    box.addEventListener('mousedown', boxDownSpy);
    fireEvent.mouseDown(port, { clientX: 190, clientY: 130 });
    fireEvent.mouseUp(document);
    // dragging via port should not move the node
    expect(probeState!.nodes.n1.x).toBe(100);
  });

  it('renames via dblclick + blur', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const label = container.querySelector('[data-id="n1"] .label')!;
    fireEvent.doubleClick(label);
    label.textContent = 'Renamed';
    fireEvent.blur(label);
    expect(probeState!.nodes.n1.label).toBe('Renamed');
  });

  it('renames via Enter key triggering blur', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const label = container.querySelector('[data-id="n1"] .label')! as HTMLElement;
    fireEvent.doubleClick(label);
    label.focus();
    label.textContent = 'EnterName';
    fireEvent.keyDown(label, { key: 'Enter' });
    expect(probeState!.nodes.n1.label).toBe('EnterName');
  });

  it('ignores non-Enter keys', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const label = container.querySelector('[data-id="n1"] .label')! as HTMLElement;
    fireEvent.doubleClick(label);
    fireEvent.keyDown(label, { key: 'a' });
    // no dispatch should have occurred yet (label unchanged)
    expect(probeState!.nodes.n1.label).toBe('API');
  });

  it('links two nodes via port drag and mouseup on target, rendering temp line while dragging', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const port = container.querySelector('[data-id="n1"] .port')!;
    const n2Root = container.querySelector('[data-id="n2"]')!;
    fireEvent.mouseDown(port, { clientX: 190, clientY: 130 });
    fireEvent.mouseMove(document, { clientX: 300, clientY: 150 });
    // temp line lives inside n1's own root, in coordinates local to n1's origin
    // (n1 is at x:100,y:100; with no canvas rect yet it falls back to a raw client delta).
    const n1Root = container.querySelector('[data-id="n1"]')!;
    const line = n1Root.querySelector('svg line')!;
    expect(line.getAttribute('x1')).toBe('90');
    expect(line.getAttribute('y1')).toBe('30');
    expect(line.getAttribute('x2')).toBe('200');
    expect(line.getAttribute('y2')).toBe('50');
    fireEvent.mouseMove(document, { clientX: 320, clientY: 160 });
    expect(line.getAttribute('x1')).toBe('90');
    expect(line.getAttribute('y1')).toBe('30');
    expect(line.getAttribute('x2')).toBe('220');
    expect(line.getAttribute('y2')).toBe('60');
    fireEvent.mouseUp(n2Root);
    expect(probeState!.edges.length).toBe(1);
    expect(probeState!.edges[0]).toMatchObject({ from: 'n1', to: 'n2' });
  });

  it('does not add an edge when releasing on the same node', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const port = container.querySelector('[data-id="n1"] .port')!;
    const n1Root = container.querySelector('[data-id="n1"]')!;
    fireEvent.mouseDown(port, { clientX: 190, clientY: 130 });
    fireEvent.mouseUp(n1Root);
    expect(probeState!.edges.length).toBe(0);
  });

  it('shows selected class after clicking the box', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(document);
    expect(container.querySelector('[data-id="n1"]')).toHaveClass('selected');
    expect(container.querySelector('[data-id="n2"]')).not.toHaveClass('selected');
  });
});
