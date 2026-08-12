import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { GraphProvider, useGraph } from '../../../store/GraphContext';
import { DbInspector } from '../../../components/db/DbInspector';
import type { GraphState } from '../../../types';

function seed(): GraphState {
  return {
    nodes: { n1: { id: 'n1', key: 'sql', icon: 'sql', label: 'Orders DB', x: 0, y: 0 } },
    edges: [], regions: [], seq: 1,
  };
}

let probeState: GraphState | null = null;
function Probe() {
  probeState = useGraph().state;
  return null;
}

function renderInspector(onClose: () => void, initial = seed()) {
  return render(
    <GraphProvider initial={initial}>
      <Probe />
      <DbInspector node={initial.nodes.n1} onClose={onClose} />
    </GraphProvider>,
  );
}

describe('DbInspector', () => {
  it('closes without dispatching on Escape', () => {
    const onClose = vi.fn();
    renderInspector(onClose);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    expect(probeState!.nodes.n1.db).toBeUndefined();
  });

  it('ignores non-Escape keys', () => {
    const onClose = vi.fn();
    renderInspector(onClose);
    fireEvent.keyDown(document, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes without dispatching on backdrop click / Cancel button', () => {
    const onClose = vi.fn();
    renderInspector(onClose);
    fireEvent.mouseDown(document.querySelector('.db-backdrop')!);
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(probeState!.nodes.n1.db).toBeUndefined();
  });

  it('does not close when clicking inside the modal body', () => {
    const onClose = vi.fn();
    renderInspector(onClose);
    fireEvent.mouseDown(document.querySelector('.db-modal')!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('builds a full table (columns, PK/FK, shard key, indexes, constraints) and saves it', () => {
    const onClose = vi.fn();
    renderInspector(onClose);

    fireEvent.click(screen.getByText('+ Table'));
    fireEvent.change(screen.getByLabelText('Table name'), { target: { value: 'orders' } });
    // set then clear then set again, so both branches of the `value || undefined`
    // fallback actually run (React's input value-tracker skips a no-op same-value change).
    fireEvent.change(screen.getByLabelText('Shard key'), { target: { value: 'x' } });
    fireEvent.change(screen.getByLabelText('Shard key'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Shard key'), { target: { value: 'order_id' } });

    fireEvent.click(screen.getByText('+ Column'));
    fireEvent.change(screen.getByLabelText('Column name'), { target: { value: 'id' } });
    fireEvent.change(screen.getByLabelText('Column type'), { target: { value: 'x' } });
    fireEvent.change(screen.getByLabelText('Column type'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Column type'), { target: { value: 'uuid' } });
    fireEvent.click(screen.getByLabelText('PK'));
    fireEvent.click(screen.getByLabelText('PK')); // toggle off then back on below covers both branches
    fireEvent.click(screen.getByLabelText('PK'));
    fireEvent.change(screen.getByLabelText('Foreign key target'), { target: { value: 'x' } });
    fireEvent.change(screen.getByLabelText('Foreign key target'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Foreign key target'), { target: { value: 'users.id' } });

    fireEvent.change(screen.getByLabelText('New indexes'), { target: { value: 'idx_order_id' } });
    fireEvent.click(screen.getByLabelText('Add indexes'));

    fireEvent.change(screen.getByLabelText('New constraints'), { target: { value: 'unique(order_id)' } });
    fireEvent.keyDown(screen.getByLabelText('New constraints'), { key: 'a' }); // non-Enter: no-op branch
    fireEvent.keyDown(screen.getByLabelText('New constraints'), { key: 'Enter' });

    fireEvent.click(screen.getByText('Save'));

    expect(onClose).toHaveBeenCalledOnce();
    expect(probeState!.nodes.n1.db).toEqual({
      tables: [{
        name: 'orders',
        shardKey: 'order_id',
        columns: [{ name: 'id', type: 'uuid', pk: true, fk: 'users.id' }],
        indexes: ['idx_order_id'],
        constraints: ['unique(order_id)'],
      }],
    });
  });

  it('ignores adding a blank index/constraint and supports removing items and columns/tables', () => {
    const onClose = vi.fn();
    renderInspector(onClose);

    fireEvent.click(screen.getByText('+ Table'));
    fireEvent.click(screen.getByText('+ Column'));

    // blank draft: clicking + must not add an entry
    fireEvent.click(screen.getByLabelText('Add indexes'));
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);

    fireEvent.change(screen.getByLabelText('New indexes'), { target: { value: 'idx_a' } });
    fireEvent.click(screen.getByLabelText('Add indexes'));
    fireEvent.click(screen.getByLabelText('Remove idx_a'));

    fireEvent.click(screen.getByLabelText('Remove column'));
    fireEvent.click(screen.getByText('Remove table'));

    fireEvent.click(screen.getByText('Save'));
    expect(probeState!.nodes.n1.db).toEqual({ tables: [] });
  });

  it('preloads an existing db and edits it in place', () => {
    const initial = seed();
    initial.nodes.n1.db = {
      tables: [{ name: 'users', shardKey: undefined, columns: [{ name: 'id' }], indexes: [], constraints: [] }],
    };
    const onClose = vi.fn();
    renderInspector(onClose, initial);
    expect(screen.getByLabelText('Table name')).toHaveValue('users');
    fireEvent.change(screen.getByLabelText('Table name'), { target: { value: 'accounts' } });
    fireEvent.click(screen.getByText('Save'));
    expect(probeState!.nodes.n1.db!.tables[0].name).toBe('accounts');
  });
});
