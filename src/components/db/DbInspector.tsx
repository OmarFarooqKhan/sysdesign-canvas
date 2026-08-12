import { useEffect, useState } from 'react';
import type { GraphNode } from '../../types';
import { useGraph } from '../../store/GraphContext';
import { addTable, removeTable, updateTable } from './dbModel';
import { TableEditor } from './TableEditor';

/** Modal to add/edit a DB node's table schema. Escape/Cancel discards changes. */
export function DbInspector({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const { dispatch } = useGraph();
  const [tables, setTables] = useState(() => node.db?.tables ?? []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = () => {
    dispatch({ type: 'SET_NODE_DB', id: node.id, db: { tables } });
    onClose();
  };

  return (
    <div className="db-backdrop" onMouseDown={onClose}>
      <div className="db-modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3>DB schema — {node.label}</h3>
        {tables.map((t, i) => (
          <TableEditor
            key={i}
            table={t}
            onChange={(next) => setTables(updateTable(tables, i, next))}
            onRemove={() => setTables(removeTable(tables, i))}
          />
        ))}
        <button type="button" onClick={() => setTables(addTable(tables))}>+ Table</button>
        <div className="db-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" className="primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
