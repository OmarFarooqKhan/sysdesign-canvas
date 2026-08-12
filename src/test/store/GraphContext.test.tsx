import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import type { GraphState } from '../../types';

function Probe() {
  const { state, dispatch, canUndo, canRedo } = useGraph();
  return (
    <div>
      <span data-testid="count">{Object.keys(state.nodes).length}</span>
      <span data-testid="undo">{String(canUndo)}</span>
      <span data-testid="redo">{String(canRedo)}</span>
      <button onClick={() => dispatch({ type: 'ADD_NODE', def: { key: 'a', icon: 'a', label: 'A' }, x: 0, y: 0 })}>add</button>
      <button onClick={() => dispatch({ type: 'UNDO' })}>undo</button>
      <button onClick={() => dispatch({ type: 'REDO' })}>redo</button>
    </div>
  );
}

describe('GraphContext', () => {
  it('provides state and reflects undo/redo availability', () => {
    render(<GraphProvider><Probe /></GraphProvider>);
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('undo')).toHaveTextContent('false');
    fireEvent.click(screen.getByText('add'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('undo')).toHaveTextContent('true');
    fireEvent.click(screen.getByText('undo'));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('redo')).toHaveTextContent('true');
    fireEvent.click(screen.getByText('redo'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('accepts a seeded initial state', () => {
    const initial: GraphState = {
      nodes: { n1: { id: 'n1', key: 'a', icon: 'a', label: 'A', x: 0, y: 0 } },
      edges: [], regions: [], seq: 1,
    };
    render(<GraphProvider initial={initial}><Probe /></GraphProvider>);
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('throws when used outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/GraphProvider/);
    vi.restoreAllMocks();
  });
});
