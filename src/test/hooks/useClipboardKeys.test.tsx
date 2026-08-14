import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import { UIProvider, useUI } from '../../store/UIContext';
import { useClipboardKeys } from '../../hooks/useClipboardKeys';

/** Test-only harness exposing seed/select actions and live counts. */
function Harness() {
  const { state, dispatch } = useGraph();
  const { selectNode, selectNodes, clipboard } = useUI();
  useClipboardKeys();
  const addNode = () => dispatch({ type: 'ADD_NODE', def: { key: 'server', icon: 'server', label: 'S' }, x: 10, y: 10 });
  const addEdge = () => dispatch({ type: 'ADD_EDGE', from: 'n1', to: 'n2' });
  return (
    <div>
      <button onClick={addNode}>add-node</button>
      <button onClick={addEdge}>add-edge</button>
      <button onClick={() => selectNode('n1')}>sel-n1</button>
      <button onClick={() => selectNodes(['n1', 'n2'])}>sel-both</button>
      <span data-testid="node-count">{Object.keys(state.nodes).length}</span>
      <span data-testid="edge-count">{state.edges.length}</span>
      <span data-testid="clip-count">{clipboard ? clipboard.nodes.length : '-'}</span>
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

describe('useClipboardKeys', () => {
  it('mod+C copies the selected node into the clipboard slot', () => {
    renderHarness();
    fireEvent.click(screen.getByText('add-node'));
    fireEvent.click(screen.getByText('sel-n1'));
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true });
    expect(screen.getByTestId('clip-count')).toHaveTextContent('1');
  });

  it('mod+C with nothing selected does nothing', () => {
    renderHarness();
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true });
    expect(screen.getByTestId('clip-count')).toHaveTextContent('-');
  });

  it('mod+V pastes the clipboard contents in as new nodes (one ADD_ITEMS dispatch)', () => {
    renderHarness();
    fireEvent.click(screen.getByText('add-node'));
    fireEvent.click(screen.getByText('sel-n1'));
    fireEvent.keyDown(document, { key: 'c', metaKey: true });
    fireEvent.keyDown(document, { key: 'v', metaKey: true });
    expect(screen.getByTestId('node-count')).toHaveTextContent('2');
  });

  it('mod+V with an empty clipboard does nothing', () => {
    renderHarness();
    fireEvent.click(screen.getByText('add-node'));
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true });
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
  });

  it('mod+D duplicates the selection directly, independent of whatever is in the clipboard', () => {
    renderHarness();
    fireEvent.click(screen.getByText('add-node'));
    fireEvent.click(screen.getByText('sel-n1'));
    fireEvent.keyDown(document, { key: 'd', ctrlKey: true });
    expect(screen.getByTestId('node-count')).toHaveTextContent('2');
    expect(screen.getByTestId('clip-count')).toHaveTextContent('-');
  });

  it('mod+D with nothing selected does nothing', () => {
    renderHarness();
    fireEvent.click(screen.getByText('add-node'));
    fireEvent.keyDown(document, { key: 'd', ctrlKey: true });
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
  });

  it('copies only edges whose both endpoints are selected, and paste round-trips them', () => {
    renderHarness();
    fireEvent.click(screen.getByText('add-node')); // n1
    fireEvent.click(screen.getByText('add-node')); // n2
    fireEvent.click(screen.getByText('add-edge')); // n1 -> n2
    fireEvent.click(screen.getByText('sel-both'));
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true });
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true });
    expect(screen.getByTestId('node-count')).toHaveTextContent('4');
    expect(screen.getByTestId('edge-count')).toHaveTextContent('2');
  });

  it('ignores shortcuts while a contentEditable element is focused', () => {
    renderHarness();
    fireEvent.click(screen.getByText('add-node'));
    fireEvent.click(screen.getByText('sel-n1'));
    screen.getByTestId('editable').focus();
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true });
    expect(screen.getByTestId('clip-count')).toHaveTextContent('-');
  });

  it('ignores c/v/d without a modifier key held', () => {
    renderHarness();
    fireEvent.click(screen.getByText('add-node'));
    fireEvent.click(screen.getByText('sel-n1'));
    fireEvent.keyDown(document, { key: 'c' });
    expect(screen.getByTestId('clip-count')).toHaveTextContent('-');
  });

  it('ignores unrelated keys even with a modifier held', () => {
    renderHarness();
    fireEvent.keyDown(document, { key: 'x', ctrlKey: true });
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');
  });
});
