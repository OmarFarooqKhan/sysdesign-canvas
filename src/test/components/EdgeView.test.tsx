import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import { EdgeView } from '../../components/EdgeView';
import type { Edge, GraphNode, GraphState } from '../../types';

const from: GraphNode = { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 100, y: 100 };
const to: GraphNode = { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 300, y: 100 };
const edge: Edge = { id: 'e1', from: 'n1', to: 'n2', label: 'calls' };

function seed(e: Edge = edge): GraphState {
  return { nodes: { n1: from, n2: to }, edges: [e], regions: [], seq: 2 };
}

let probeState: GraphState | null = null;
let probeUndo: (() => void) | null = null;
function Probe() {
  const { state, dispatch } = useGraph();
  probeState = state;
  probeUndo = () => dispatch({ type: 'UNDO' });
  return null;
}

function renderEdge(overrides: Partial<Parameters<typeof EdgeView>[0]> = {}, initial?: GraphState) {
  const props = { edge, from, to, edgeMode: 'curved' as const, selected: false, defaultBend: 0, onSelect: vi.fn(), ...overrides };
  const utils = render(
    <GraphProvider initial={initial ?? seed(props.edge)}>
      <Probe />
      <svg>
        <EdgeView {...props} />
      </svg>
    </GraphProvider>,
  );
  return { ...utils, onSelect: props.onSelect };
}

describe('EdgeView', () => {
  it('renders a path for curved mode', () => {
    const { container } = renderEdge({ edgeMode: 'curved' });
    const path = container.querySelector('path.edge')!;
    expect(path).toBeTruthy();
    expect(path.getAttribute('d')).toContain('C');
    expect(path.getAttribute('stroke')).toBe('#5b6b8c');
  });

  it('renders a path for ortho mode', () => {
    const { container } = renderEdge({ edgeMode: 'ortho' });
    const path = container.querySelector('path.edge')!;
    expect(path.getAttribute('d')).toContain('L');
  });

  it('uses accent stroke when selected', () => {
    const { container } = renderEdge({ selected: true });
    const path = container.querySelector('path.edge')!;
    expect(path.getAttribute('stroke')).toBe('#4f8cff');
  });

  it('omits the start marker for a one-way edge', () => {
    const { container } = renderEdge();
    const path = container.querySelector('path.edge')!;
    expect(path.getAttribute('marker-start')).toBeNull();
    expect(path.getAttribute('marker-end')).toBe('url(#arrow)');
  });

  it('renders a start marker too when the edge is bidirectional', () => {
    const { container } = renderEdge({ edge: { ...edge, bidirectional: true } });
    const path = container.querySelector('path.edge')!;
    expect(path.getAttribute('marker-start')).toBe('url(#arrow)');
  });

  it('renders the edge label at the path midpoint', () => {
    const { container } = renderEdge();
    const text = container.querySelector('text.edge-label')!;
    expect(text.textContent).toBe('calls');
  });

  it('calls onSelect with the edge and click coordinates when path is clicked', () => {
    const { container, onSelect } = renderEdge();
    const path = container.querySelector('path.edge')!;
    path.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 50, clientY: 60 }));
    expect(onSelect).toHaveBeenCalledWith(edge, 50, 60);
  });

  it('calls onSelect when the label text is clicked', () => {
    const { container, onSelect } = renderEdge();
    const text = container.querySelector('text.edge-label')!;
    text.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 10, clientY: 20 }));
    expect(onSelect).toHaveBeenCalledWith(edge, 10, 20);
  });

  it('a plain mousedown+mouseup with no movement still opens selection via the click event', () => {
    const { container, onSelect } = renderEdge();
    const path = container.querySelector('path.edge')!;
    fireEvent.mouseDown(path, { clientX: 200, clientY: 132 });
    fireEvent.mouseUp(document, { clientX: 200, clientY: 132 });
    fireEvent.click(path, { clientX: 200, clientY: 132 });
    expect(onSelect).toHaveBeenCalledWith(edge, 200, 132);
    expect(probeState!.edges[0].bend).toBeUndefined();
  });

  it('small movements below the drag threshold do not set a bend', () => {
    const { container, onSelect } = renderEdge();
    const path = container.querySelector('path.edge')!;
    fireEvent.mouseDown(path, { clientX: 200, clientY: 132 });
    fireEvent.mouseMove(document, { clientX: 201, clientY: 133 });
    fireEvent.mouseUp(document, { clientX: 201, clientY: 133 });
    fireEvent.click(path, { clientX: 201, clientY: 133 });
    expect(probeState!.edges[0].bend).toBeUndefined();
    expect(onSelect).toHaveBeenCalled();
  });

  it('dragging the path past the threshold sets a bend and suppresses the click-select', () => {
    const { container, onSelect } = renderEdge();
    const path = container.querySelector('path.edge')!;
    fireEvent.mouseDown(path, { clientX: 200, clientY: 132 });
    fireEvent.mouseMove(document, { clientX: 200, clientY: 152 });
    fireEvent.mouseUp(document, { clientX: 200, clientY: 152 });
    fireEvent.click(path, { clientX: 200, clientY: 152 });
    expect(probeState!.edges[0].bend).not.toBeUndefined();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('dragging the label also updates the bend', () => {
    const { container } = renderEdge();
    const text = container.querySelector('text.edge-label')!;
    fireEvent.mouseDown(text, { clientX: 200, clientY: 132 });
    fireEvent.mouseMove(document, { clientX: 200, clientY: 150 });
    fireEvent.mouseUp(document, { clientX: 200, clientY: 150 });
    expect(probeState!.edges[0].bend).not.toBeUndefined();
  });

  it('coalesces a multi-move drag into a single undo entry', () => {
    const { container } = renderEdge();
    const path = container.querySelector('path.edge')!;
    fireEvent.mouseDown(path, { clientX: 200, clientY: 132 });
    fireEvent.mouseMove(document, { clientX: 200, clientY: 150 });
    fireEvent.mouseMove(document, { clientX: 200, clientY: 170 });
    fireEvent.mouseUp(document, { clientX: 200, clientY: 170 });
    const bent = probeState!.edges[0].bend;
    expect(bent).not.toBeUndefined();
    act(() => probeUndo!());
    expect(probeState!.edges[0].bend).toBeUndefined();
  });

  it('falls back to defaultBend only when edge.bend is unset', () => {
    const zeroDefault = renderEdge({ defaultBend: 0 }).container.querySelector('path.edge')!.getAttribute('d');
    const nonZeroDefault = renderEdge({ defaultBend: 24 }).container.querySelector('path.edge')!.getAttribute('d');
    expect(nonZeroDefault).not.toBe(zeroDefault);

    const explicitZero = renderEdge({ defaultBend: 24, edge: { ...edge, bend: 0 } })
      .container.querySelector('path.edge')!.getAttribute('d');
    expect(explicitZero).toBe(zeroDefault);
  });

  it('starting a new drag after one ends begins its own session', () => {
    const { container } = renderEdge();
    const path = container.querySelector('path.edge')!;
    fireEvent.mouseDown(path, { clientX: 200, clientY: 132 });
    fireEvent.mouseMove(document, { clientX: 200, clientY: 150 });
    fireEvent.mouseUp(document, { clientX: 200, clientY: 150 });
    const firstBend = probeState!.edges[0].bend;

    fireEvent.mouseDown(path, { clientX: 200, clientY: 150 });
    fireEvent.mouseMove(document, { clientX: 200, clientY: 170 });
    fireEvent.mouseUp(document, { clientX: 200, clientY: 170 });
    expect(probeState!.edges[0].bend).not.toBe(firstBend);

    act(() => probeUndo!());
    expect(probeState!.edges[0].bend).toBe(firstBend);
  });
});
