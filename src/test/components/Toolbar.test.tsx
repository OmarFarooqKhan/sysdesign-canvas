import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { GraphProvider } from '../../store/GraphContext';
import { UIProvider, useUI } from '../../store/UIContext';
import { useGraph } from '../../store/GraphContext';
import { ViewportProvider, useViewport } from '../../store/ViewportContext';
import { PlaythroughProvider } from '../../store/PlaythroughContext';
import { Toolbar } from '../../components/Toolbar';

const { exportPngMock } = vi.hoisted(() => ({ exportPngMock: vi.fn() }));
vi.mock('../../lib/exportPng', () => ({ exportPng: exportPngMock }));
const { downloadSvgMock } = vi.hoisted(() => ({ downloadSvgMock: vi.fn() }));
vi.mock('../../lib/exportSvg', () => ({ downloadSvg: downloadSvgMock }));

/** Test-only harness: exposes a seed action + live node count alongside the Toolbar. */
function Harness({ withCanvasRef = true }: { withCanvasRef?: boolean }) {
  const { state, dispatch } = useGraph();
  const { zoom, panX, panY } = useViewport();
  return (
    <>
      <button onClick={() => dispatch({ type: 'ADD_NODE', def: { key: 'server', icon: 'server', label: 'Server' }, x: 10, y: 10 })}>
        seed-node
      </button>
      <span data-testid="node-count">{Object.keys(state.nodes).length}</span>
      <span data-testid="region-count">{state.regions.length}</span>
      <span data-testid="edge-mode">{useUI().edgeMode}</span>
      <span data-testid="viewport">{`${zoom},${panX},${panY}`}</span>
      {withCanvasRef && <CanvasRefProbe />}
      <Toolbar />
    </>
  );
}

/** Stands in for Canvas.tsx's root div, which Toolbar's Fit button measures via canvasRef. */
function CanvasRefProbe() {
  const { canvasRef } = useViewport();
  return <div ref={canvasRef} data-testid="canvas-rect" />;
}

function renderHarness() {
  return render(
    <GraphProvider>
      <UIProvider>
        <ViewportProvider>
          <PlaythroughProvider>
            <Harness />
          </PlaythroughProvider>
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>,
  );
}

describe('Toolbar', () => {
  beforeEach(() => {
    exportPngMock.mockClear();
    downloadSvgMock.mockClear();
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

  it('+ Region dispatches ADD_REGION', async () => {
    const user = userEvent.setup();
    renderHarness();
    expect(screen.getByTestId('region-count')).toHaveTextContent('0');
    await user.click(screen.getByRole('button', { name: '+ Region' }));
    expect(screen.getByTestId('region-count')).toHaveTextContent('1');
  });

  it('edge toggle flips label, aria-pressed and the active class', async () => {
    const user = userEvent.setup();
    renderHarness();
    const edgeBtn = screen.getByRole('button', { name: /^Edges:/ });
    expect(edgeBtn).toHaveTextContent('Edges: Curved');
    expect(edgeBtn).toHaveAttribute('aria-pressed', 'false');
    expect(edgeBtn).not.toHaveClass('active');
    await user.click(edgeBtn);
    expect(edgeBtn).toHaveTextContent('Edges: Orthogonal');
    expect(edgeBtn).toHaveAttribute('aria-pressed', 'true');
    expect(edgeBtn).toHaveClass('active');
    await user.click(edgeBtn);
    expect(edgeBtn).toHaveTextContent('Edges: Curved');
    expect(edgeBtn).toHaveAttribute('aria-pressed', 'false');
    expect(edgeBtn).not.toHaveClass('active');
  });

  it('template select without existing nodes loads without a confirm dialog', async () => {
    const user = userEvent.setup();
    renderHarness();
    const select = screen.getByRole('combobox', { name: 'Templates' });
    await user.selectOptions(select, 'url');
    expect(document.querySelector('.alert-backdrop')).not.toBeInTheDocument();
    expect(screen.getByTestId('node-count')).toHaveTextContent('6');
    expect((select as HTMLSelectElement).value).toBe('');
  });

  it('template select with existing nodes: confirming OK replaces canvas', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('seed-node'));
    const edgeBtn = screen.getByRole('button', { name: /^Edges:/ });
    await user.click(edgeBtn);
    expect(edgeBtn).toHaveTextContent('Edges: Orthogonal');

    const select = screen.getByRole('combobox', { name: 'Templates' });
    await user.selectOptions(select, 'chat');
    expect(screen.getByText('Replace the current canvas with this template?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'OK' }));
    expect(document.querySelector('.alert-backdrop')).not.toBeInTheDocument();
    expect(screen.getByTestId('node-count')).toHaveTextContent('6');
    expect(edgeBtn).toHaveTextContent('Edges: Curved');
  });

  it('template select with existing nodes: cancelling keeps canvas', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('seed-node'));
    const edgeBtn = screen.getByRole('button', { name: /^Edges:/ });
    await user.click(edgeBtn);
    expect(edgeBtn).toHaveTextContent('Edges: Orthogonal');

    const select = screen.getByRole('combobox', { name: 'Templates' });
    await user.selectOptions(select, 'chat');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(document.querySelector('.alert-backdrop')).not.toBeInTheDocument();
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
    expect(edgeBtn).toHaveTextContent('Edges: Orthogonal');
  });

  it('export select: "as JSON" triggers a download and resets to blank', async () => {
    const user = userEvent.setup();
    renderHarness();
    const select = screen.getByRole('combobox', { name: 'Export' });
    await user.selectOptions(select, 'json');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect((select as HTMLSelectElement).value).toBe('');
  });

  it('export select: "as PNG" calls exportPng with the current state and canvas element', async () => {
    const user = userEvent.setup();
    renderHarness();
    const select = screen.getByRole('combobox', { name: 'Export' });
    await user.selectOptions(select, 'png');
    expect(exportPngMock).toHaveBeenCalledTimes(1);
    expect(exportPngMock.mock.calls[0][1]).toBe(screen.getByTestId('canvas-rect'));
    expect((select as HTMLSelectElement).value).toBe('');
  });

  it('export select: "as SVG" calls downloadSvg with the current state and edge mode', async () => {
    const user = userEvent.setup();
    renderHarness();
    const select = screen.getByRole('combobox', { name: 'Export' });
    await user.selectOptions(select, 'svg');
    expect(downloadSvgMock).toHaveBeenCalledTimes(1);
    expect(downloadSvgMock.mock.calls[0][1]).toBe('curved');
    expect((select as HTMLSelectElement).value).toBe('');
  });

  it('export select: blank option is a no-op', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Export' }), 'json');
    await user.selectOptions(screen.getByLabelText('Export'), '');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(exportPngMock).not.toHaveBeenCalled();
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

  it('import shows a custom alert dialog on malformed JSON, dismissible via OK', async () => {
    const user = userEvent.setup();
    const { container } = renderHarness();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['not json'], 'bad.json', { type: 'application/json' });
    await user.upload(input, file);
    await waitFor(() => expect(document.querySelector('.alert-modal')).toBeInTheDocument());
    expect(screen.getByText(/^Could not import:/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'OK' }));
    expect(document.querySelector('.alert-modal')).not.toBeInTheDocument();
  });

  it('clear: confirming OK empties the canvas', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('seed-node'));
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('Clear the whole canvas?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'OK' }));
    expect(document.querySelector('.alert-backdrop')).not.toBeInTheDocument();
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');
  });

  it('clear: cancelling keeps the canvas', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('seed-node'));
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(document.querySelector('.alert-backdrop')).not.toBeInTheDocument();
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
  });

  it('clear: pressing Escape keeps the canvas', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('seed-node'));
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    await user.keyboard('{Escape}');
    expect(document.querySelector('.alert-backdrop')).not.toBeInTheDocument();
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

  it('Fit is a no-op on an empty canvas', async () => {
    const user = userEvent.setup();
    renderHarness();
    const rect = screen.getByTestId('canvas-rect');
    vi.spyOn(rect, 'getBoundingClientRect').mockReturnValue({ width: 800, height: 600, left: 0, top: 0 } as DOMRect);
    await user.click(screen.getByRole('button', { name: '⤢ Fit' }));
    expect(screen.getByTestId('viewport')).toHaveTextContent('1,0,0');
  });

  it('Fit computes zoom/pan from content bounds and the canvas rect', async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByText('seed-node'));
    const rect = screen.getByTestId('canvas-rect');
    vi.spyOn(rect, 'getBoundingClientRect').mockReturnValue({ width: 800, height: 600, left: 0, top: 0 } as DOMRect);
    await user.click(screen.getByRole('button', { name: '⤢ Fit' }));
    expect(screen.getByTestId('viewport')).toHaveTextContent('2,');
  });

  it('Fit is a no-op when the canvas ref is not attached', async () => {
    const user = userEvent.setup();
    render(
      <GraphProvider>
        <UIProvider>
          <ViewportProvider>
            <PlaythroughProvider>
              <Harness withCanvasRef={false} />
            </PlaythroughProvider>
          </ViewportProvider>
        </UIProvider>
      </GraphProvider>,
    );
    await user.click(screen.getByText('seed-node'));
    await user.click(screen.getByRole('button', { name: '⤢ Fit' }));
    expect(screen.getByTestId('viewport')).toHaveTextContent('1,0,0');
  });

  it('Pan toggle flips aria-pressed and the active class', async () => {
    const user = userEvent.setup();
    renderHarness();
    const panBtn = screen.getByRole('button', { name: '✋ Pan' });
    expect(panBtn).toHaveAttribute('aria-pressed', 'false');
    expect(panBtn).not.toHaveClass('active');
    await user.click(panBtn);
    expect(panBtn).toHaveAttribute('aria-pressed', 'true');
    expect(panBtn).toHaveClass('active');
    await user.click(panBtn);
    expect(panBtn).toHaveAttribute('aria-pressed', 'false');
    expect(panBtn).not.toHaveClass('active');
  });

  it('Present toggle flips aria-pressed/active and disables editing controls, leaving Fit/Pan/Export live (D1)', async () => {
    const user = userEvent.setup();
    renderHarness();
    const presentBtn = screen.getByRole('button', { name: '▶ Present' });
    expect(presentBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(presentBtn);
    expect(presentBtn).toHaveAttribute('aria-pressed', 'true');
    expect(presentBtn).toHaveClass('active');
    expect(screen.getByRole('combobox', { name: 'Templates' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '+ Region' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Edges:/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Diagrams…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '⤢ Fit' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: '✋ Pan' })).not.toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Export' })).not.toBeDisabled();

    await user.click(presentBtn);
    expect(presentBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Clear' })).not.toBeDisabled();
  });
});
