import { useState } from 'react';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { LibraryDialog } from './LibraryDialog';

/** Toolbar entry point for the named diagram library: button + its modal. */
export function LibraryButton() {
  const { state, dispatch } = useGraph();
  const { edgeMode, setEdgeMode } = useUI();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="group-start" onClick={() => setOpen(true)}>Diagrams…</button>
      {open && (
        <LibraryDialog
          state={state}
          edgeMode={edgeMode}
          onLoad={(d) => { dispatch({ type: 'LOAD', data: d }); setEdgeMode(d.edgeMode); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
