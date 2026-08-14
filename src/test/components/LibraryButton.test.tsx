import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import { UIProvider, useUI } from '../../store/UIContext';
import { LibraryButton } from '../../components/LibraryButton';

function Harness() {
  const { state, dispatch } = useGraph();
  const { edgeMode, setEdgeMode } = useUI();
  return (
    <>
      <span data-testid="node-count">{Object.keys(state.nodes).length}</span>
      <span data-testid="edge-mode">{edgeMode}</span>
      <button onClick={() => dispatch({ type: 'ADD_NODE', def: { key: 'a', icon: 'a', label: 'A' }, x: 0, y: 0 })}>
        add-node
      </button>
      <button onClick={() => dispatch({ type: 'CLEAR' })}>clear</button>
      <button onClick={() => setEdgeMode('ortho')}>set-ortho</button>
      <LibraryButton />
    </>
  );
}

const renderHarness = () => render(<GraphProvider><UIProvider><Harness /></UIProvider></GraphProvider>);

beforeEach(() => localStorage.clear());

describe('LibraryButton', () => {
  it('is closed by default and opens the dialog on click', async () => {
    const user = userEvent.setup();
    renderHarness();
    expect(screen.queryByText('Diagrams')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Diagrams…' }));
    expect(screen.getByText('Diagrams')).toBeInTheDocument();
  });

  it('closes via the dialog Close button', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByRole('button', { name: 'Diagrams…' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Diagrams')).not.toBeInTheDocument();
  });

  it('loading a save dispatches LOAD, restores edge mode, and closes the dialog', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('add-node'));
    await user.click(screen.getByText('set-ortho'));
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: 'Diagrams…' }));
    await user.type(screen.getByLabelText('Save current as'), 'Doc');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await user.click(screen.getByText('clear'));
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');

    await user.click(screen.getByRole('button', { name: 'Load' }));
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
    expect(screen.getByTestId('edge-mode')).toHaveTextContent('ortho');
    expect(screen.queryByText('Diagrams')).not.toBeInTheDocument();
  });
});
