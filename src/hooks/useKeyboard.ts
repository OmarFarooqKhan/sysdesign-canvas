import { useEffect } from 'react';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';

/** Global shortcuts: Delete/Backspace removes the selection, Cmd/Ctrl+Z undoes, redo variants redo. */
export function useKeyboard() {
  const { dispatch } = useGraph();
  const { selectedNodeIds, selectedRegionId, selectedEdgeId, clearSelection } = useUI();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip while editing a label/title (contenteditable reflects reliably in jsdom too).
      if ((document.activeElement as Element).getAttribute('contenteditable') === 'true') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.length) {
          selectedNodeIds.forEach((id) => dispatch({ type: 'DELETE_NODE', id }));
          clearSelection();
        } else if (selectedRegionId) dispatch({ type: 'DELETE_REGION', id: selectedRegionId });
        else if (selectedEdgeId) dispatch({ type: 'DELETE_EDGE', id: selectedEdgeId });
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
        return;
      }
      if (mod && ((key === 'z' && e.shiftKey) || key === 'y')) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dispatch, selectedNodeIds, selectedRegionId, selectedEdgeId, clearSelection]);
}
