import { useEffect, useRef, useState } from 'react';
import { useGraph } from '../store/GraphContext';
import { useViewport } from '../store/ViewportContext';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '../lib/viewport';

/** Floating cluster, bottom-right of the canvas: undo/redo + zoom, translucent at rest, opaque on hover. */
export function ZoomControls() {
  const { dispatch, canUndo, canRedo } = useGraph();
  const { zoom, zoomIn, zoomOut, setViewport } = useViewport();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const skipCommitRef = useRef(false);

  const startEdit = () => {
    setDraft(String(Math.round(zoom * 100)));
    setEditing(true);
  };
  const commit = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n)) setViewport({ zoom: n / 100 });
    setEditing(false);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.currentTarget.blur();
    else if (e.key === 'Escape') { skipCommitRef.current = true; e.currentTarget.blur(); }
  };
  const handleBlur = () => {
    if (skipCommitRef.current) { skipCommitRef.current = false; setEditing(false); return; }
    commit(draft);
  };

  // The canvas's own drag handlers call preventDefault() on pointerdown (to suppress
  // text-selection while marquee/panning), which also suppresses the browser's native
  // focus-shift blur — so a click there wouldn't otherwise commit the edit. Catch any
  // outside pointerdown in the capture phase, ahead of that, as a blur fallback.
  useEffect(() => {
    if (!editing) return;
    const onPointerDown = (e: PointerEvent) => {
      if (e.target !== inputRef.current) commit(draft);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [editing, draft]);

  return (
    <div className="zoom-controls">
      <button disabled={!canUndo} onClick={() => dispatch({ type: 'UNDO' })} aria-label="Undo">↶</button>
      <button disabled={!canRedo} onClick={() => dispatch({ type: 'REDO' })} aria-label="Redo">↷</button>
      <div className="zoom-divider" />
      <button onClick={zoomOut} disabled={zoom <= ZOOM_MIN} aria-label="Zoom out">−</button>
      {editing ? (
        <input
          ref={inputRef}
          className="zoom-pct-input"
          type="number"
          min={ZOOM_MIN * 100}
          max={ZOOM_MAX * 100}
          step={ZOOM_STEP * 100}
          value={draft}
          autoFocus
          aria-label="Zoom percentage"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <button className="zoom-pct" onClick={startEdit} aria-label="Edit zoom">{Math.round(zoom * 100)}%</button>
      )}
      <button onClick={zoomIn} disabled={zoom >= ZOOM_MAX} aria-label="Zoom in">+</button>
    </div>
  );
}
