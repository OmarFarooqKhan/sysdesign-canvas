import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { EdgeMode, GraphData, GraphState } from '../types';
import { toData } from '../lib/io';
import { listSaves, loadSave, removeSave, saveAs } from '../lib/library';
import { LibraryRow } from './LibraryRow';

interface LibraryDialogProps {
  state: GraphState;
  edgeMode: EdgeMode;
  onLoad: (data: GraphData & { edgeMode: EdgeMode }) => void;
  onClose: () => void;
}

/** Modal listing named saved diagrams: Load/Delete per row, plus "save current as…".
 *  Portaled onto document.body for the same stacking-context reasons as DbInspector.tsx. */
export function LibraryDialog({ state, edgeMode, onLoad, onClose }: LibraryDialogProps) {
  const [names, setNames] = useState(() => listSaves());
  const [name, setName] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = () => {
    saveAs(name.trim(), toData(state, edgeMode));
    setNames(listSaves());
    setName('');
  };

  const handleLoad = (n: string) => {
    const data = loadSave(n);
    if (data) onLoad(data);
  };

  const handleDelete = (n: string) => {
    removeSave(n);
    setNames(listSaves());
  };

  return createPortal(
    <div className="db-backdrop" onMouseDown={onClose}>
      <div className="db-modal library-modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3>Diagrams</h3>
        {names.length === 0 && <p className="library-empty">No saved diagrams yet.</p>}
        <ul className="library-list">
          {names.map((n) => (
            <LibraryRow key={n} name={n} onLoad={() => handleLoad(n)} onDelete={() => handleDelete(n)} />
          ))}
        </ul>
        <div className="library-save-as">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Save current as…"
            aria-label="Save current as"
          />
          <button type="button" className="primary" onClick={handleSave} disabled={!name.trim()}>Save</button>
        </div>
        <div className="db-actions">
          <button type="button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
