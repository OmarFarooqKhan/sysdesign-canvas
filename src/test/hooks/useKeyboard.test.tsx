import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GraphProvider, useGraph } from '../store/GraphContext';
import { UIProvider, useUI } from '../store/UIContext';
import { useKeyboard } from './useKeyboard';

/** Test-only harness exposing seed/select actions and live counts. */
function Harness() {
  const { state, dispatch } = useGraph();
  const { selectNode, selectRegion, selectEdge } = useUI();
  useKeyboard();
  return (
    <div>
      <button onClick={() => dispatch({ type: 'ADD_NODE', def: { key: 'server', icon: 'server', label: 'Server' }, x: 0, y: 0 })}>
        add-node
      </button>
      <button onClick={() => selectNode('n1')}>select-node</button>
      <button onClick={() => dispatch({ type: 'ADD_REGION' })}>add-region</button>
      <button onClick={() => selectRegion('r1')}>select-region</button>
      <button onClick={() => dispatch({ type: 'ADD_EDGE', from: 'a', to: 'b' })}>add-edge</button>
      <button onClick={() => selectEdge('e1')}>select-edge</button>
      <span data-testid="node-count">{Object.keys(state.nodes).length}</span>
      <span data-testid="region-count">{state.regions.length}</span>
      <span data-testid="edge-count">{state.edges.length}</span>
      <div contentEditable data-testid="editable" suppressContentEditableWarning>
        edit
      </div>
    </div>
  );
}

function renderHarness() {
  return render(
    <GraphProvider>
      <UIProvider>
        <Harness />
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
