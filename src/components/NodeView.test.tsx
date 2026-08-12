import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { GraphProvider, useGraph } from '../store/GraphContext';
import { UIProvider, useUI } from '../store/UIContext';
import { NodeView } from './NodeView';
import type { GraphState } from '../types';

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

/** Test-only trigger for a multi-selection, since marquee drag lives elsewhere. */
function SelectAllButton({ ids }: { ids: string[] }) {
  const { selectNodes } = useUI();
  return <button onClick={() => selectNodes(ids)}>select-all</button>;
}

function renderNodes(initial: GraphState, multiIds?: string[]) {
  return render(
    <GraphProvider initial={initial}>
      <UIProvider>
        <Probe />
        {multiIds && <SelectAllButton ids={multiIds} />}
        <NodeView node={initial.nodes.n1} />
        <NodeView node={initial.nodes.n2} />
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
    const line = container.querySelector('svg[style*="position: fixed"] line')!;
    // the line must stay anchored at the port (press point) and follow the cursor,
    // not collapse to a zero-length point at the current mouse position.
    expect(line.getAttribute('x1')).toBe('190');
    expect(line.getAttribute('y1')).toBe('130');
    expect(line.getAttribute('x2')).toBe('300');
    expect(line.getAttribute('y2')).toBe('150');
    fireEvent.mouseMove(document, { clientX: 320, clientY: 160 });
    expect(line.getAttribute('x1')).toBe('190');
    expect(line.getAttribute('y1')).toBe('130');
    expect(line.getAttribute('x2')).toBe('320');
    expect(line.getAttribute('y2')).toBe('160');
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

  it('dragging a node that is part of a multi-selection moves the whole group', () => {
    const initial = seed();
    const { container } = renderNodes(initial, ['n1', 'n2']);
    fireEvent.click(screen.getByText('select-all'));
    expect(container.querySelector('[data-id="n1"]')).toHaveClass('selected');
    expect(container.querySelector('[data-id="n2"]')).toHaveClass('selected');

    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 130, clientY: 90 });
    fireEvent.mouseUp(document);

    // n1 started at (100,100), n2 at (300,100); both shift by (30,-10).
    expect(probeState!.nodes.n1).toMatchObject({ x: 130, y: 90 });
    expect(probeState!.nodes.n2).toMatchObject({ x: 330, y: 90 });
    // the multi-selection survives the drag (still both selected).
    expect(container.querySelector('[data-id="n1"]')).toHaveClass('selected');
    expect(container.querySelector('[data-id="n2"]')).toHaveClass('selected');
  });

  it('group drag clamps every node to non-negative coordinates', () => {
    const initial = seed();
    const { container } = renderNodes(initial, ['n1', 'n2']);
    fireEvent.click(screen.getByText('select-all'));
    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: -1000, clientY: -1000 });
    fireEvent.mouseUp(document);
    expect(probeState!.nodes.n1).toMatchObject({ x: 0, y: 0 });
    expect(probeState!.nodes.n2).toMatchObject({ x: 0, y: 0 });
  });

  it('dragging a node NOT in the current multi-selection collapses to just that node', () => {
    const initial = seed();
    const { container } = renderNodes(initial, ['n1']);
    fireEvent.click(screen.getByText('select-all')); // selects only n1, so n2 is not a "group"
    const box = container.querySelector('[data-id="n2"] .box')!;
    fireEvent.mouseDown(box, { clientX: 300, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 320, clientY: 110 });
    fireEvent.mouseUp(document);
    expect(probeState!.nodes.n2).toMatchObject({ x: 320, y: 110 });
    expect(probeState!.nodes.n1).toMatchObject({ x: 100, y: 100 }); // unaffected, single-drag semantics
    expect(container.querySelector('[data-id="n1"]')).not.toHaveClass('selected');
    expect(container.querySelector('[data-id="n2"]')).toHaveClass('selected');
  });
});
