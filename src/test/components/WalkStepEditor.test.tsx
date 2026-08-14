import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import { WalkStepEditor } from '../../components/WalkStepEditor';
import type { GraphState, WalkStep } from '../../types';

function seed(walkthrough?: WalkStep[]): GraphState {
  return {
    nodes: { n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 0, y: 0 } },
    edges: [], regions: [], seq: 1,
    ...(walkthrough ? { walkthrough } : {}),
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
      <WalkStepEditor node={initial.nodes.n1} onClose={onClose} />
    </GraphProvider>,
  );
}

const textarea = () => screen.getByLabelText('Playthrough step text');

describe('WalkStepEditor', () => {
  it('closes without dispatching on Escape, ignoring other keys', () => {
    const onClose = vi.fn();
    renderEditor(onClose);
    fireEvent.keyDown(document, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    expect(probeState!.walkthrough).toBeUndefined();
  });

  it('closes without dispatching on backdrop click / Cancel, but not on clicks inside', () => {
    const onClose = vi.fn();
    renderEditor(onClose);
    fireEvent.mouseDown(document.querySelector('.walk-modal')!);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseDown(document.querySelector('.db-backdrop')!);
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(probeState!.walkthrough).toBeUndefined();
  });

  it('saves trimmed step text (upsert) and closes', () => {
    const onClose = vi.fn();
    renderEditor(onClose);
    fireEvent.change(textarea(), { target: { value: '  the request lands  ' } });
    fireEvent.click(screen.getByText('Save'));
    expect(onClose).toHaveBeenCalledOnce();
    expect(probeState!.walkthrough).toEqual([{ nodeId: 'n1', text: 'the request lands' }]);
  });

  it('saving blank text is a no-op save (removal stays explicit in the menu)', () => {
    const onClose = vi.fn();
    renderEditor(onClose, seed([{ nodeId: 'n1', text: 'keep me' }]));
    fireEvent.change(textarea(), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Save'));
    expect(onClose).toHaveBeenCalledOnce();
    expect(probeState!.walkthrough).toEqual([{ nodeId: 'n1', text: 'keep me' }]);
  });

  it('starts empty when the walkthrough has no step for this node', () => {
    renderEditor(vi.fn(), seed([{ nodeId: 'other', text: 'not mine' }]));
    expect(textarea()).toHaveValue('');
  });

  it('preloads the node\'s existing step text and edits it in place', () => {
    const onClose = vi.fn();
    renderEditor(onClose, seed([{ nodeId: 'n1', text: 'old text' }]));
    expect(textarea()).toHaveValue('old text');
    fireEvent.change(textarea(), { target: { value: 'new text' } });
    fireEvent.click(screen.getByText('Save'));
    expect(probeState!.walkthrough).toEqual([{ nodeId: 'n1', text: 'new text' }]);
  });

  it('portals the editor onto document.body', () => {
    renderEditor(vi.fn());
    const backdrop = document.querySelector('.db-backdrop')!;
    expect(backdrop.parentElement).toBe(document.body);
    expect(document.querySelector('.walk-modal h3')!.textContent).toBe('Playthrough step — API');
  });
});
