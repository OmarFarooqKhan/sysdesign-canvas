import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import { NotesEditor } from '../../components/NotesEditor';
import type { GraphState } from '../../types';

function seed(): GraphState {
  return {
    nodes: { n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 0, y: 0 } },
    edges: [], regions: [], seq: 1,
  };
}

let probeState: GraphState | null = null;
function Probe() {
  probeState = useGraph().state;
  return null;
}

function renderEditor(onClose: () => void, initial = seed()) {
  return render(
    <GraphProvider initial={initial}>
      <Probe />
      <NotesEditor node={initial.nodes.n1} onClose={onClose} />
    </GraphProvider>,
  );
}

describe('NotesEditor', () => {
  it('closes without dispatching on Escape', () => {
    const onClose = vi.fn();
    renderEditor(onClose);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    expect(probeState!.nodes.n1.notes).toBeUndefined();
  });

  it('ignores non-Escape keys', () => {
    const onClose = vi.fn();
    renderEditor(onClose);
    fireEvent.keyDown(document, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes without dispatching on backdrop click / Cancel button', () => {
    const onClose = vi.fn();
    renderEditor(onClose);
    fireEvent.mouseDown(document.querySelector('.db-backdrop')!);
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(probeState!.nodes.n1.notes).toBeUndefined();
  });

  it('does not close when clicking inside the modal body', () => {
    const onClose = vi.fn();
    renderEditor(onClose);
    fireEvent.mouseDown(document.querySelector('.notes-modal')!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('saves trimmed notes text and closes', () => {
    const onClose = vi.fn();
    renderEditor(onClose);
    fireEvent.change(screen.getByLabelText('Node notes'), { target: { value: '  ~10k QPS  ' } });
    fireEvent.click(screen.getByText('Save'));
    expect(onClose).toHaveBeenCalledOnce();
    expect(probeState!.nodes.n1.notes).toBe('~10k QPS');
  });

  it('saving a blank/whitespace-only textarea clears any existing notes', () => {
    const initial = seed();
    initial.nodes.n1.notes = 'existing note';
    const onClose = vi.fn();
    renderEditor(onClose, initial);
    expect(screen.getByLabelText('Node notes')).toHaveValue('existing note');
    fireEvent.change(screen.getByLabelText('Node notes'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Save'));
    expect(probeState!.nodes.n1.notes).toBeUndefined();
  });

  it('preloads existing notes and edits them in place', () => {
    const initial = seed();
    initial.nodes.n1.notes = 'old note';
    const onClose = vi.fn();
    renderEditor(onClose, initial);
    fireEvent.change(screen.getByLabelText('Node notes'), { target: { value: 'new note' } });
    fireEvent.click(screen.getByText('Save'));
    expect(probeState!.nodes.n1.notes).toBe('new note');
  });

  it('portals the notes editor onto document.body, outside the node', () => {
    const onClose = vi.fn();
    renderEditor(onClose);
    const backdrop = document.querySelector('.db-backdrop')!;
    expect(backdrop.parentElement).toBe(document.body);
  });
});
