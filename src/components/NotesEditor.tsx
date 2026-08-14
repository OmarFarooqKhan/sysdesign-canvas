import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GraphNode } from '../types';
import { useGraph } from '../store/GraphContext';

/** Modal to add/edit a node's free-text notes (QPS, storage estimates, etc). Escape/Cancel
 *  discards changes. Mirrors DbInspector's open/save/cancel/Escape pattern. */
export function NotesEditor({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const { dispatch } = useGraph();
  const [notes, setNotes] = useState(node.notes ?? '');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = () => {
    dispatch({ type: 'SET_NODE_NOTES', id: node.id, notes: notes.trim() });
    onClose();
  };

  // Portaled onto document.body for the same stacking-context reasons as DbInspector.tsx.
  return createPortal(
    <div className="db-backdrop" onMouseDown={onClose}>
      <div className="db-modal notes-modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3>Notes — {node.label}</h3>
        <textarea
          className="notes-textarea"
          aria-label="Node notes"
          autoFocus
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="QPS, storage estimates, tradeoffs…"
        />
        <div className="db-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" className="primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
