import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LibraryDialog } from '../../components/LibraryDialog';
import type { GraphState } from '../../types';

const state: GraphState = {
  nodes: { n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 1, y: 2 } },
  edges: [],
  regions: [],
  seq: 1,
};

function renderDialog(onLoad = vi.fn(), onClose = vi.fn()) {
  const utils = render(<LibraryDialog state={state} edgeMode="curved" onLoad={onLoad} onClose={onClose} />);
  return { ...utils, onLoad, onClose };
}

beforeEach(() => localStorage.clear());

describe('LibraryDialog', () => {
  it('shows an empty message when there are no saves', () => {
    renderDialog();
    expect(screen.getByText('No saved diagrams yet.')).toBeInTheDocument();
  });

  it('closes on Escape, backdrop click and the Close button, but not on inner clicks', () => {
    const { onClose } = renderDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(document.querySelector('.db-modal')!);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(document.querySelector('.db-backdrop')!);
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('ignores non-Escape keys', () => {
    const { onClose } = renderDialog();
    fireEvent.keyDown(document, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Save is disabled for a blank/whitespace name and enabled once text is entered', async () => {
    const user = userEvent.setup();
    renderDialog();
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText('Save current as'), '   ');
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText('Save current as'), 'My Diagram');
    expect(save).toBeEnabled();
  });

  it('saves the current diagram under the typed name, lists it, and clears the input', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.type(screen.getByLabelText('Save current as'), 'My Diagram');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('My Diagram')).toBeInTheDocument();
    expect(screen.queryByText('No saved diagrams yet.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Save current as')).toHaveValue('');
  });

  it('lists multiple saves alphabetically', async () => {
    const user = userEvent.setup();
    renderDialog();
    for (const name of ['Zebra', 'Apple']) {
      await user.type(screen.getByLabelText('Save current as'), name);
      await user.click(screen.getByRole('button', { name: 'Save' }));
    }
    const rows = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(rows[0]).toContain('Apple');
    expect(rows[1]).toContain('Zebra');
  });

  it('Load reads the saved diagram and calls onLoad with it', async () => {
    const user = userEvent.setup();
    const { onLoad } = renderDialog();
    await user.type(screen.getByLabelText('Save current as'), 'My Diagram');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(screen.getByRole('button', { name: 'Load' }));
    expect(onLoad).toHaveBeenCalledWith({ edgeMode: 'curved', nodes: [state.nodes.n1], edges: [], regions: [] });
  });

  it('Load is a no-op when the underlying document was externally corrupted after being listed', async () => {
    const user = userEvent.setup();
    const { onLoad } = renderDialog();
    await user.type(screen.getByLabelText('Save current as'), 'My Diagram');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    localStorage.setItem('sysdesign-canvas:save:My Diagram', 'not json');
    await user.click(screen.getByRole('button', { name: 'Load' }));
    expect(onLoad).not.toHaveBeenCalled();
  });

  it('Delete removes the row and it no longer loads', async () => {
    const user = userEvent.setup();
    const { onLoad } = renderDialog();
    await user.type(screen.getByLabelText('Save current as'), 'My Diagram');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('No saved diagrams yet.')).toBeInTheDocument();
    expect(onLoad).not.toHaveBeenCalled();
  });
});
