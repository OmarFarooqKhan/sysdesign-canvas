import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { GraphProvider } from '../store/GraphContext';
import { UIProvider, useUI } from '../store/UIContext';
import { useGraph } from '../store/GraphContext';
import { Toolbar } from './Toolbar';

/** Test-only harness: exposes a seed action + live node count alongside the Toolbar. */
function Harness() {
  const { state, dispatch } = useGraph();
  return (
    <>
      <button onClick={() => dispatch({ type: 'ADD_NODE', def: { key: 'server', icon: 'server', label: 'Server' }, x: 10, y: 10 })}>
        seed-node
      </button>
      <span data-testid="node-count">{Object.keys(state.nodes).length}</span>
      <span data-testid="edge-mode">{useUI().edgeMode}</span>
      <Toolbar />
    </>
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

describe('Toolbar', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (URL as unknown as { createObjectURL: typeof URL.createObjectURL }).createObjectURL = vi.fn(() => 'blob:mock');
    (URL as unknown as { revokeObjectURL: typeof URL.revokeObjectURL }).revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title and hint', () => {
    renderHarness();
    expect(screen.getByText('🧩 System Design Canvas')).toBeInTheDocument();
    expect(screen.getByText(/drag from the palette/i)).toBeInTheDocument();
  });

  it('Undo/Redo toggle enabled state and dispatch', async () => {
    const user = userEvent.setup();
    renderHarness();
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

  it('+ Region dispatches ADD_REGION', async () => {
    const user = userEvent.setup();
    renderHarness();
    const undoBtn = screen.getByRole('button', { name: 'Undo' });
    expect(undoBtn).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '+ Region' }));
    expect(undoBtn).toBeEnabled();
  });

  it('edge toggle flips label', async () => {
    const user = userEvent.setup();
    renderHarness();
    const edgeBtn = screen.getByRole('button', { name: /^Edges:/ });
    expect(edgeBtn).toHaveTextContent('Edges: Curved');
    await user.click(edgeBtn);
    expect(edgeBtn).toHaveTextContent('Edges: Orthogonal');
    await user.click(edgeBtn);
    expect(edgeBtn).toHaveTextContent('Edges: Curved');
  });

  it('template select without existing nodes loads without confirm', async () => {
    const user = userEvent.setup();
    renderHarness();
    const select = screen.getByRole('combobox', { name: 'Templates' });
    await user.selectOptions(select, 'url');
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('node-count')).toHaveTextContent('6');
    expect((select as HTMLSelectElement).value).toBe('');
  });

  it('template select with existing nodes: confirm true replaces canvas', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('seed-node'));
    const edgeBtn = screen.getByRole('button', { name: /^Edges:/ });
    await user.click(edgeBtn);
    expect(edgeBtn).toHaveTextContent('Edges: Orthogonal');

    confirmSpy.mockReturnValue(true);
    const select = screen.getByRole('combobox', { name: 'Templates' });
    await user.selectOptions(select, 'chat');
    expect(confirmSpy).toHaveBeenCalledWith('Replace the current canvas with this template?');
    expect(screen.getByTestId('node-count')).toHaveTextContent('6');
    expect(edgeBtn).toHaveTextContent('Edges: Curved');
  });

  it('template select with existing nodes: confirm false keeps canvas', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('seed-node'));
    const edgeBtn = screen.getByRole('button', { name: /^Edges:/ });
    await user.click(edgeBtn);
    expect(edgeBtn).toHaveTextContent('Edges: Orthogonal');

    confirmSpy.mockReturnValue(false);
    const select = screen.getByRole('combobox', { name: 'Templates' });
    await user.selectOptions(select, 'chat');
    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
    expect(edgeBtn).toHaveTextContent('Edges: Orthogonal');
  });

  it('export triggers a download', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByRole('button', { name: 'Export JSON' }));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('import button click opens the hidden file input', async () => {
    const user = userEvent.setup();
    const { container } = renderHarness();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});
    await user.click(screen.getByRole('button', { name: 'Import' }));
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('import parses a valid file and loads it', async () => {
    const user = userEvent.setup();
    const { container } = renderHarness();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const data = { edgeMode: 'ortho', nodes: [], edges: [], regions: [] };
    const file = new File([JSON.stringify(data)], 'x.json', { type: 'application/json' });
    await user.upload(input, file);
    await waitFor(() => expect(screen.getByTestId('edge-mode')).toHaveTextContent('ortho'));
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');
  });

  it('import alerts on malformed JSON', async () => {
    const user = userEvent.setup();
    const { container } = renderHarness();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['not json'], 'bad.json', { type: 'application/json' });
    await user.upload(input, file);
    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(alertSpy.mock.calls[0][0]).toMatch(/^Could not import:/);
  });

  it('clear with confirm true empties the canvas', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('seed-node'));
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
    confirmSpy.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(confirmSpy).toHaveBeenCalledWith('Clear the whole canvas?');
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');
  });

  it('clear with confirm false keeps the canvas', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('seed-node'));
    confirmSpy.mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
  });

  it('selecting the blank template option does nothing', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('seed-node'));
    await user.selectOptions(screen.getByLabelText('Templates'), '');
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
  });

  it('an import with no file selected is a no-op', () => {
    renderHarness();
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');
  });
});
