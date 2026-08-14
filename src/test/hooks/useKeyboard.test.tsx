import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import { UIProvider, useUI } from '../../store/UIContext';
import { useKeyboard } from '../../hooks/useKeyboard';

/** Test-only harness exposing seed/select actions and live counts. */
function Harness({ disabled = false }: { disabled?: boolean }) {
  const { state, dispatch } = useGraph();
  const { selectNode, selectNodes, selectedNodeIds, selectRegion, selectEdge } = useUI();
  useKeyboard(disabled);
  const addNode = () => dispatch({ type: 'ADD_NODE', def: { key: 'server', icon: 'server', label: 'Server' }, x: 0, y: 0 });
  return (
    <div>
      <button onClick={addNode}>add-node</button>
      <button onClick={() => selectNode('n1')}>select-node</button>
      <button onClick={() => selectNodes(['n1', 'n2'])}>select-two-nodes</button>
      <button onClick={() => dispatch({ type: 'ADD_REGION' })}>add-region</button>
      <button onClick={() => selectRegion('r1')}>select-region</button>
      <button onClick={() => dispatch({ type: 'ADD_EDGE', from: 'a', to: 'b' })}>add-edge</button>
      <button onClick={() => selectEdge('e1')}>select-edge</button>
      <span data-testid="node-count">{Object.keys(state.nodes).length}</span>
      <span data-testid="region-count">{state.regions.length}</span>
      <span data-testid="edge-count">{state.edges.length}</span>
      <span data-testid="selected-count">{selectedNodeIds.length}</span>
      <span data-testid="n1-x">{state.nodes.n1?.x ?? '-'}</span>
      <span data-testid="n1-y">{state.nodes.n1?.y ?? '-'}</span>
      <span data-testid="n2-x">{state.nodes.n2?.x ?? '-'}</span>
      <span data-testid="r1-x">{state.regions.find((r) => r.id === 'r1')?.x ?? '-'}</span>
      <span data-testid="r1-y">{state.regions.find((r) => r.id === 'r1')?.y ?? '-'}</span>
      <div contentEditable data-testid="editable" suppressContentEditableWarning>
        edit
      </div>
    </div>
  );
}

function renderHarness(disabled = false) {
  return render(
    <GraphProvider>
      <UIProvider>
        <Harness disabled={disabled} />
      </UIProvider>
    </GraphProvider>,
  );
}

describe('useKeyboard', () => {
  it('Delete removes the selected node', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    await user.click(screen.getByText('select-node'));
    fireEvent.keyDown(document, { key: 'Delete' });
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');
  });

  it('Backspace removes the selected region', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-region'));
    await user.click(screen.getByText('select-region'));
    fireEvent.keyDown(document, { key: 'Backspace' });
    expect(screen.getByTestId('region-count')).toHaveTextContent('0');
  });

  it('Delete removes the selected edge', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-edge'));
    await user.click(screen.getByText('select-edge'));
    fireEvent.keyDown(document, { key: 'Delete' });
    expect(screen.getByTestId('edge-count')).toHaveTextContent('0');
  });

  it('Delete removes every node in a multi-selection and their edges, then clears selection', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node')); // n1
    await user.click(screen.getByText('add-node')); // n2
    await user.click(screen.getByText('add-edge')); // unrelated edge a->b, should survive
    await user.click(screen.getByText('select-two-nodes'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('2');
    fireEvent.keyDown(document, { key: 'Delete' });
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');
    expect(screen.getByTestId('edge-count')).toHaveTextContent('1');
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
  });

  it('Delete with nothing selected does nothing', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    fireEvent.keyDown(document, { key: 'Delete' });
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
  });

  it('Ctrl+Z undoes the last action', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');
  });

  it('Cmd+Z (metaKey) undoes the last action', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    fireEvent.keyDown(document, { key: 'z', metaKey: true });
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');
  });

  it('Shift+Z redoes after an undo', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');
    fireEvent.keyDown(document, { key: 'Z', ctrlKey: true, shiftKey: true });
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
  });

  it('Ctrl+Y redoes after an undo', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    fireEvent.keyDown(document, { key: 'y', ctrlKey: true });
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
  });

  it('plain z without a modifier does nothing', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    fireEvent.keyDown(document, { key: 'z' });
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
  });

  it('ignores shortcuts while a contentEditable element is focused', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    await user.click(screen.getByText('select-node'));
    screen.getByTestId('editable').focus();
    expect(document.activeElement).toBe(screen.getByTestId('editable'));
    fireEvent.keyDown(document, { key: 'Delete' });
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
  });
});

describe('useKeyboard arrow-key nudge (B2)', () => {
  it('ArrowRight nudges the selected node by 1px', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node')); // n1 at (0,0)
    await user.click(screen.getByText('select-node'));
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByTestId('n1-x')).toHaveTextContent('1');
    expect(screen.getByTestId('n1-y')).toHaveTextContent('0');
  });

  it('Shift+ArrowDown nudges the selected node by 8px', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    await user.click(screen.getByText('select-node'));
    fireEvent.keyDown(document, { key: 'ArrowDown', shiftKey: true });
    expect(screen.getByTestId('n1-y')).toHaveTextContent('8');
  });

  it('ArrowUp and ArrowLeft move in the negative direction, clamped to non-negative', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    await user.click(screen.getByText('select-node'));
    fireEvent.keyDown(document, { key: 'ArrowUp' });
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByTestId('n1-x')).toHaveTextContent('0');
    expect(screen.getByTestId('n1-y')).toHaveTextContent('0');
  });

  it('nudges every node in a multi-selection together', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node')); // n1
    await user.click(screen.getByText('add-node')); // n2
    await user.click(screen.getByText('select-two-nodes'));
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByTestId('n1-x')).toHaveTextContent('1');
    expect(screen.getByTestId('n2-x')).toHaveTextContent('1');
  });

  it('holding a key (repeated keydown, no keyup) coalesces into a single undo entry', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    await user.click(screen.getByText('select-node'));
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByTestId('n1-x')).toHaveTextContent('3');
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    expect(screen.getByTestId('n1-x')).toHaveTextContent('0'); // one undo reverts all three
  });

  it('keyup ends the session, so a later press is a separate undo entry', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    await user.click(screen.getByText('select-node'));
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyUp(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyUp(document, { key: 'ArrowRight' });
    expect(screen.getByTestId('n1-x')).toHaveTextContent('2');
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    expect(screen.getByTestId('n1-x')).toHaveTextContent('1'); // only the second press undoes
  });

  it('keyup for a non-arrow key does not end an in-progress nudge session', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    await user.click(screen.getByText('select-node'));
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyUp(document, { key: 'Shift' }); // unrelated keyup — must not close the session
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByTestId('n1-x')).toHaveTextContent('2');
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    expect(screen.getByTestId('n1-x')).toHaveTextContent('0'); // one undo reverts both presses
  });

  it('a lone selected region nudges via MOVE_REGION', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-region')); // r1 at default (80,80)
    await user.click(screen.getByText('select-region'));
    fireEvent.keyDown(document, { key: 'ArrowRight', shiftKey: true });
    expect(screen.getByTestId('r1-x')).toHaveTextContent('88');
    expect(screen.getByTestId('r1-y')).toHaveTextContent('80');
  });

  it('arrow keys do nothing when neither a node nor a region is selected', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByTestId('n1-x')).toHaveTextContent('0');
  });

  it('is a safe no-op for a region selection left dangling after the region was deleted', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-region'));
    await user.click(screen.getByText('select-region'));
    fireEvent.keyDown(document, { key: 'Delete' }); // deletes r1 without clearing selectedRegionId
    expect(screen.getByTestId('region-count')).toHaveTextContent('0');
    fireEvent.keyDown(document, { key: 'ArrowRight' }); // must not throw
    expect(screen.getByTestId('region-count')).toHaveTextContent('0');
  });

  it('ignores shortcuts while a contentEditable element is focused', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    await user.click(screen.getByText('select-node'));
    screen.getByTestId('editable').focus();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByTestId('n1-x')).toHaveTextContent('0');
  });
});

describe('useKeyboard disabled (presentation mode, D1)', () => {
  it('suppresses Delete, nudge, and undo when disabled', async () => {
    const user = userEvent.setup();
    renderHarness(true);
    await user.click(screen.getByText('add-node'));
    await user.click(screen.getByText('select-node'));
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByTestId('n1-x')).toHaveTextContent('0');
    fireEvent.keyDown(document, { key: 'Delete' });
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
  });

  it('a keyup while disabled does not end a session', async () => {
    const user = userEvent.setup();
    renderHarness(true);
    await user.click(screen.getByText('add-node'));
    await user.click(screen.getByText('select-node'));
    fireEvent.keyUp(document, { key: 'ArrowRight' });
    expect(screen.getByTestId('n1-x')).toHaveTextContent('0');
  });
});
