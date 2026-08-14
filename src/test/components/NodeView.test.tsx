import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import { UIProvider, useUI } from '../../store/UIContext';
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

/** Test-only trigger for a multi-selection, since marquee drag lives elsewhere. */
function SelectAllButton({ ids }: { ids: string[] }) {
  const { selectNodes } = useUI();
  return <button onClick={() => selectNodes(ids)}>select-all</button>;
}

function renderNodes(initial: GraphState, multiIds?: string[]) {
  return render(
    <GraphProvider initial={initial}>
      <UIProvider>
        <ViewportProvider>
          <Probe />
          <ZoomProbe />
          {multiIds && <SelectAllButton ids={multiIds} />}
          <NodeView node={initial.nodes.n1} />
          <NodeView node={initial.nodes.n2} />
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>,
  );
}

describe('NodeView', () => {
  it('drags to update position with one undo step', () => {
    // altKey bypasses snap-to-grid/alignment (see the dedicated snap describe block below) so
    // this exercises plain drag-to-position arithmetic with exact pixel expectations.
    const initial = seed();
    const { container } = renderNodes(initial);
    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 140, clientY: 120, altKey: true });
    fireEvent.mouseMove(document, { clientX: 150, clientY: 130, altKey: true });
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
    fireEvent.mouseMove(document, { clientX: 140, clientY: 120, altKey: true });
    fireEvent.mouseUp(document);
    expect(probeState!.nodes.n1.x).toBe(120);
    expect(probeState!.nodes.n1.y).toBe(110);
  });

  it('clamps position to non-negative', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: -1000, clientY: -1000, altKey: true });
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

  it('dragging a node that is part of a multi-selection moves the whole group', () => {
    const initial = seed();
    const { container } = renderNodes(initial, ['n1', 'n2']);
    fireEvent.click(screen.getByText('select-all'));
    expect(container.querySelector('[data-id="n1"]')).toHaveClass('selected');
    expect(container.querySelector('[data-id="n2"]')).toHaveClass('selected');

    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 130, clientY: 90, altKey: true });
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
    fireEvent.mouseMove(document, { clientX: -1000, clientY: -1000, altKey: true });
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
    fireEvent.mouseMove(document, { clientX: 320, clientY: 110, altKey: true });
    fireEvent.mouseUp(document);
    expect(probeState!.nodes.n2).toMatchObject({ x: 320, y: 110 });
    expect(probeState!.nodes.n1).toMatchObject({ x: 100, y: 100 }); // unaffected, single-drag semantics
    expect(container.querySelector('[data-id="n1"]')).not.toHaveClass('selected');
    expect(container.querySelector('[data-id="n2"]')).toHaveClass('selected');
  });

  it('has no has-data class or badge when a node has no db schema', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    expect(container.querySelector('[data-id="n2"]')).not.toHaveClass('has-data');
    expect(container.querySelector('[data-id="n2"] .db-badge')).toBeNull();
  });

  it('shows the has-data class and a table-count badge once db schema is populated', () => {
    const initial = seed({
      nodes: {
        n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 100, y: 100 },
        n2: {
          id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 300, y: 100,
          db: { tables: [{ name: 'a', columns: [], indexes: [], constraints: [] }, { name: 'b', columns: [], indexes: [], constraints: [] }] },
        },
      },
    });
    const { container } = renderNodes(initial);
    const n2 = container.querySelector('[data-id="n2"]')!;
    expect(n2).toHaveClass('has-data');
    expect(n2.querySelector('.db-badge')).toHaveTextContent('2');
  });

  it('double-clicking the box of a SQL DB node opens the schema editor', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const box = container.querySelector('[data-id="n2"] .box')!;
    fireEvent.doubleClick(box);
    expect(document.querySelector('.db-modal')).not.toBeNull();
  });

  it('portals the schema editor onto document.body, outside the node (so no other node can stack over it)', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    fireEvent.doubleClick(container.querySelector('[data-id="n2"] .box')!);
    const backdrop = document.querySelector('.db-backdrop')!;
    expect(backdrop.closest('.node')).toBeNull();
    expect(backdrop.parentElement).toBe(document.body);
  });

  it('double-clicking the box of a non-DB node does not open the schema editor', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.doubleClick(box);
    expect(document.querySelector('.db-modal')).toBeNull();
  });

  it('double-clicking the port does not open the schema editor', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const port = container.querySelector('[data-id="n2"] .port')!;
    fireEvent.doubleClick(port);
    expect(document.querySelector('.db-modal')).toBeNull();
  });

  it('closing the schema editor (Escape) removes it without touching state', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const box = container.querySelector('[data-id="n2"] .box')!;
    fireEvent.doubleClick(box);
    expect(document.querySelector('.db-modal')).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('.db-modal')).toBeNull();
    expect(probeState!.nodes.n2.db).toBeUndefined();
  });
});

describe('NodeView notes (C2)', () => {
  it('has no has-notes class or badge when a node has no notes', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    expect(container.querySelector('[data-id="n1"]')).not.toHaveClass('has-notes');
    expect(container.querySelector('[data-id="n1"] .notes-badge')).toBeNull();
  });

  it('shows the has-notes class, a badge, and a title tooltip once a node has notes', () => {
    const initial = seed({
      nodes: { ...seed().nodes, n2: { ...seed().nodes.n2, notes: '~10k QPS, 500GB storage' } },
    });
    const { container } = renderNodes(initial);
    const n2 = container.querySelector('[data-id="n2"]')!;
    expect(n2).toHaveClass('has-notes');
    const badge = n2.querySelector('.notes-badge')!;
    expect(badge).toHaveTextContent('📝');
    expect(badge).toHaveAttribute('title', '~10k QPS, 500GB storage');
    expect(container.querySelector('[data-id="n1"]')).not.toHaveClass('has-notes');
  });

  it('right-click opens a context menu with a Notes entry and prevents the native menu', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    // fireEvent returns dispatchEvent's result: false means a handler called preventDefault().
    const notCanceled = fireEvent.contextMenu(container.querySelector('[data-id="n1"]')!, { clientX: 50, clientY: 60 });
    expect(notCanceled).toBe(false);
    expect(document.querySelector('.ctx')).not.toBeNull();
    expect(screen.getByText('✎ Notes…')).toBeInTheDocument();
  });

  it('portals the context menu onto document.body', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    fireEvent.contextMenu(container.querySelector('[data-id="n1"]')!, { clientX: 10, clientY: 10 });
    const menu = document.querySelector('.ctx')!;
    expect(menu.closest('.node')).toBeNull();
    expect(menu.parentElement).toBe(document.body);
  });

  it('choosing "Notes…" from the context menu opens the notes editor, closing the menu', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    fireEvent.contextMenu(container.querySelector('[data-id="n1"]')!, { clientX: 10, clientY: 10 });
    fireEvent.click(screen.getByText('✎ Notes…'));
    expect(document.querySelector('.ctx')).toBeNull();
    expect(document.querySelector('.notes-modal')).not.toBeNull();
  });

  it('the context-menu → NotesEditor → Save flow dispatches SET_NODE_NOTES with the typed text', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    const root = container.querySelector('[data-id="n1"]')!;
    fireEvent.contextMenu(root, { clientX: 10, clientY: 10 });
    fireEvent.click(screen.getByText('✎ Notes…'));
    fireEvent.change(screen.getByLabelText('Node notes'), { target: { value: '~10k QPS' } });
    fireEvent.click(screen.getByText('Save'));

    expect(document.querySelector('.notes-modal')).toBeNull();
    expect(probeState!.nodes.n1.notes).toBe('~10k QPS');

    // Saving a blank textarea dispatches an empty string, which the reducer treats as "clear".
    fireEvent.contextMenu(root, { clientX: 10, clientY: 10 });
    fireEvent.click(screen.getByText('✎ Notes…'));
    fireEvent.change(screen.getByLabelText('Node notes'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Save'));
    expect(probeState!.nodes.n1.notes).toBeUndefined();
  });

  it('closes the context menu on an outside click without opening notes', () => {
    const initial = seed();
    const { container } = renderNodes(initial);
    fireEvent.contextMenu(container.querySelector('[data-id="n1"]')!, { clientX: 10, clientY: 10 });
    expect(document.querySelector('.ctx')).not.toBeNull();
    fireEvent.click(document.body);
    expect(document.querySelector('.ctx')).toBeNull();
    expect(document.querySelector('.notes-modal')).toBeNull();
  });
});

describe('NodeView snap-to-grid + alignment guides (B3)', () => {
  it('snaps to the nearest 8px grid position when no neighbor is nearby', () => {
    const initial = seed({ nodes: { ...seed().nodes, n2: { ...seed().nodes.n2, x: 2000, y: 2000 } } });
    const { container } = renderNodes(initial);
    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 153, clientY: 127 }); // raw candidate (153,127)
    fireEvent.mouseUp(document);
    expect(probeState!.nodes.n1).toMatchObject({ x: 152, y: 128 }); // nearest multiples of 8
  });

  it('snaps to align with a neighboring node\'s edge and renders a visible guide line', () => {
    const initial = seed({ nodes: { ...seed().nodes, n2: { ...seed().nodes.n2, x: 400, y: 9000 } } });
    const { container } = renderNodes(initial);
    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    // raw candidate (398,250): x is 2px from n2's left edge (400, within the 4px tolerance);
    // y (250) has no neighbor nearby and falls back to the grid.
    fireEvent.mouseMove(document, { clientX: 398, clientY: 250 });
    expect(probeState!.nodes.n1).toMatchObject({ x: 400, y: 248 });
    const verticalLefts = [...container.querySelectorAll('.guide-v')].map((el) => (el as HTMLElement).style.left);
    expect(verticalLefts).toContain('400px');
    fireEvent.mouseUp(document);
  });

  it('holding Alt bypasses snapping entirely and suppresses guides', () => {
    const initial = seed({ nodes: { ...seed().nodes, n2: { ...seed().nodes.n2, x: 400, y: 9000 } } });
    const { container } = renderNodes(initial);
    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 398, clientY: 250, altKey: true });
    expect(probeState!.nodes.n1).toMatchObject({ x: 398, y: 250 }); // exact raw position, unsnapped
    expect(container.querySelectorAll('.guide-v, .guide-h')).toHaveLength(0);
    fireEvent.mouseUp(document);
  });

  it('a non-Alt group drag also passes the anchor\'s candidate position through snap', () => {
    const initial = seed({ nodes: { ...seed().nodes, n2: { ...seed().nodes.n2, x: 2000, y: 2000 } } });
    const { container } = renderNodes(initial, ['n1', 'n2']);
    fireEvent.click(screen.getByText('select-all'));
    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    // anchor (n1) raw candidate (153,127) grid-snaps to (152,128); with only the two group
    // members in state, "others" is empty so this is a pure grid snap, not alignment.
    fireEvent.mouseMove(document, { clientX: 153, clientY: 127 });
    fireEvent.mouseUp(document);
    expect(probeState!.nodes.n1).toMatchObject({ x: 152, y: 128 });
    // the snapped delta (52,28) is applied uniformly to the rest of the group.
    expect(probeState!.nodes.n2).toMatchObject({ x: 2052, y: 2028 });
  });

  it('clears guide lines once the drag ends', () => {
    const initial = seed({ nodes: { ...seed().nodes, n2: { ...seed().nodes.n2, x: 400, y: 9000 } } });
    const { container } = renderNodes(initial);
    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 398, clientY: 250 });
    expect(container.querySelectorAll('.guide-v, .guide-h').length).toBeGreaterThan(0);
    fireEvent.mouseUp(document);
    expect(container.querySelectorAll('.guide-v, .guide-h')).toHaveLength(0);
  });
});
