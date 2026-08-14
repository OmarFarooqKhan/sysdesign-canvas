import { useEffect } from 'react';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { nodeSnapshot, offsetSnapshot } from '../lib/selection';

const NUDGE = 1;
const NUDGE_SHIFT = 8;

const ARROW_DELTAS: Record<string, [number, number]> = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
};

/** Global shortcuts: Delete/Backspace removes the selection, Cmd/Ctrl+Z undoes, redo variants
 *  redo, and arrow keys nudge the current node selection (or a lone selected region) by 1px
 *  (8px with Shift) via the MOVE_NODES/MOVE_REGION session actions — END_SESSION fires on
 *  keyup so holding a key coalesces into one undo entry per press-and-hold. `disabled` (e.g.
 *  presentation mode) suppresses every shortcut; optional and additive so existing callers are
 *  unaffected. */
export function useKeyboard(disabled = false) {
  const { state, dispatch } = useGraph();
  const { selectedNodeIds, selectedRegionId, selectedEdgeId, clearSelection } = useUI();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
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

      const arrow = ARROW_DELTAS[e.key];
      if (arrow) {
        if (!selectedNodeIds.length && !selectedRegionId) return;
        e.preventDefault();
        const d = e.shiftKey ? NUDGE_SHIFT : NUDGE;
        const dx = arrow[0] * d;
        const dy = arrow[1] * d;
        if (selectedNodeIds.length) {
          const snap = nodeSnapshot(state.nodes, selectedNodeIds);
          dispatch({ type: 'MOVE_NODES', moves: offsetSnapshot(snap, dx, dy) });
        } else {
          // The guard above already proved selectedRegionId is set whenever selectedNodeIds
          // isn't (it's the only other way past it), so it's safe to assert non-null here.
          const rid = selectedRegionId!;
          const r = state.regions.find((reg) => reg.id === rid);
          if (r) dispatch({ type: 'MOVE_REGION', id: rid, x: r.x + dx, y: r.y + dy });
        }
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
    const onKeyUp = (e: KeyboardEvent) => {
      if (!disabled && ARROW_DELTAS[e.key]) dispatch({ type: 'END_SESSION' });
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [dispatch, state, selectedNodeIds, selectedRegionId, selectedEdgeId, clearSelection, disabled]);
}
