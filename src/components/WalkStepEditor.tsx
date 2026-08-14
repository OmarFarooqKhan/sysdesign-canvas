import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GraphNode } from '../types';
import { useGraph } from '../store/GraphContext';

/** Modal to add/edit a node's playthrough-step text, mirroring NotesEditor's
 *  open/save/cancel/Escape pattern. Saving blank text is a no-op save — removing
 *  a step stays explicit, via the node's context menu. */
export function WalkStepEditor({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const { state, dispatch } = useGraph();
  const [text, setText] = useState(state.walkthrough?.find((w) => w.nodeId === node.id)?.text ?? '');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = () => {
    const t = text.trim();
    if (t) dispatch({ type: 'SET_WALK_STEP', nodeId: node.id, text: t });
    onClose();
  };

  // Portaled onto document.body for the same stacking-context reasons as DbInspector.tsx.
  return createPortal(
    <div className="db-backdrop" onMouseDown={onClose}>
      <div className="db-modal notes-modal walk-modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3>Playthrough step — {node.label}</h3>
        <textarea
          className="notes-textarea"
          aria-label="Playthrough step text"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What happens at this stop on the tour…"
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
