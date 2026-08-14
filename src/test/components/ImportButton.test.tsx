import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import { UIProvider, useUI } from '../../store/UIContext';
import { ImportButton } from '../../components/ImportButton';

function Harness({ disabled }: { disabled?: boolean }) {
  const { state } = useGraph();
  const { edgeMode } = useUI();
  return (
    <>
      <span data-testid="node-count">{Object.keys(state.nodes).length}</span>
      <span data-testid="edge-mode">{edgeMode}</span>
      <ImportButton disabled={disabled} />
    </>
  );
}

const renderHarness = (disabled?: boolean) =>
  render(<GraphProvider><UIProvider><Harness disabled={disabled} /></UIProvider></GraphProvider>);

describe('ImportButton', () => {
  it('is disabled when the disabled prop is set (D1 presentation mode)', () => {
    renderHarness(true);
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
  });

  it('click opens the hidden file input', async () => {
    const user = userEvent.setup();
    const { container } = renderHarness();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});
    await user.click(screen.getByRole('button', { name: 'Import' }));
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('parses a valid file and loads it', async () => {
    const user = userEvent.setup();
    const { container } = renderHarness();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const data = { edgeMode: 'ortho', nodes: [], edges: [], regions: [] };
    const file = new File([JSON.stringify(data)], 'x.json', { type: 'application/json' });
    await user.upload(input, file);
    await waitFor(() => expect(screen.getByTestId('edge-mode')).toHaveTextContent('ortho'));
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');
  });

  it('shows a custom alert dialog on malformed JSON, dismissible via OK', async () => {
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

  it('with no file selected is a no-op', () => {
    const { container } = renderHarness();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');
  });
});
