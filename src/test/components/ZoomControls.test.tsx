import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import { ViewportProvider, useViewport } from '../../store/ViewportContext';
import { ZoomControls } from '../../components/ZoomControls';
import { ZOOM_MAX, ZOOM_MIN } from '../../lib/viewport';

function Harness() {
  const { state, dispatch } = useGraph();
  const { setViewport } = useViewport();
  return (
    <>
      <button onClick={() => setViewport({ zoom: ZOOM_MIN })}>set-min</button>
      <button onClick={() => setViewport({ zoom: ZOOM_MAX })}>set-max</button>
      <button onClick={() => dispatch({ type: 'ADD_NODE', def: { key: 'server', icon: 'server', label: 'Server' }, x: 10, y: 10 })}>
        seed-node
      </button>
      <span data-testid="node-count">{Object.keys(state.nodes).length}</span>
      <ZoomControls />
    </>
  );
}

function setup() {
  return render(
    <GraphProvider>
      <ViewportProvider>
        <Harness />
      </ViewportProvider>
    </GraphProvider>,
  );
}

describe('ZoomControls', () => {
  it('shows the current zoom as a percentage', () => {
    setup();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('zoom in/out step the percentage', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByText('125%')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('disables zoom out at the minimum and zoom in at the maximum', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByText('set-min'));
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled();

    await user.click(screen.getByText('set-max'));
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeEnabled();
  });

  it('clicking the percentage opens an editable input seeded with the current zoom', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Edit zoom' }));
    expect(screen.getByRole('spinbutton', { name: 'Zoom percentage' })).toHaveValue(100);
  });

  it('typing a value and pressing Enter commits the new zoom', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Edit zoom' }));
    const input = screen.getByRole('spinbutton', { name: 'Zoom percentage' });
    await user.clear(input);
    await user.type(input, '150{Enter}');
    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('blurring the input commits the typed value', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Edit zoom' }));
    const input = screen.getByRole('spinbutton', { name: 'Zoom percentage' });
    await user.clear(input);
    await user.type(input, '150');
    await user.click(document.body);
    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('out-of-range typed values are clamped', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Edit zoom' }));
    const input = screen.getByRole('spinbutton', { name: 'Zoom percentage' });
    await user.clear(input);
    await user.type(input, '900{Enter}');
    expect(screen.getByText('200%')).toBeInTheDocument();
  });

  it('clearing the input and committing leaves the zoom unchanged', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Edit zoom' }));
    const input = screen.getByRole('spinbutton', { name: 'Zoom percentage' });
    await user.clear(input);
    await user.click(document.body);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('pressing Escape cancels the edit without changing the zoom', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Edit zoom' }));
    const input = screen.getByRole('spinbutton', { name: 'Zoom percentage' });
    await user.clear(input);
    await user.type(input, '150{Escape}');
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('commits on an outside pointerdown even when it prevents default (canvas drag guard)', async () => {
    const user = userEvent.setup();
    const { container } = setup();
    await user.click(screen.getByRole('button', { name: 'Edit zoom' }));
    const input = screen.getByRole('spinbutton', { name: 'Zoom percentage' });
    await user.clear(input);
    await user.type(input, '160');

    const outside = document.createElement('div');
    container.ownerDocument.body.appendChild(outside);
    outside.addEventListener('pointerdown', (e) => e.preventDefault());
    fireEvent.pointerDown(outside);

    expect(screen.getByText('160%')).toBeInTheDocument();
    outside.remove();
  });

  it('a pointerdown inside the input itself does not commit or close it', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Edit zoom' }));
    const input = screen.getByRole('spinbutton', { name: 'Zoom percentage' });
    fireEvent.pointerDown(input);
    expect(screen.getByRole('spinbutton', { name: 'Zoom percentage' })).toBeInTheDocument();
  });

  it('Undo/Redo toggle enabled state and dispatch', async () => {
    const user = userEvent.setup();
    setup();
    const undoBtn = screen.getByRole('button', { name: 'Undo' });
    const redoBtn = screen.getByRole('button', { name: 'Redo' });
    expect(undoBtn).toBeDisabled();
    expect(redoBtn).toBeDisabled();

    await user.click(screen.getByText('seed-node'));
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
    expect(undoBtn).toBeEnabled();

    await user.click(undoBtn);
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');
    expect(undoBtn).toBeDisabled();
    expect(redoBtn).toBeEnabled();

    await user.click(redoBtn);
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
    expect(redoBtn).toBeDisabled();
    expect(undoBtn).toBeEnabled();
  });
});
