import { useEffect } from 'react';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { offsetClipboard, snapshotSelection } from '../lib/clipboard';

/** Cmd/Ctrl+C copies the node selection into the UIContext clipboard slot; +V pastes it back
 *  in (offset +16/+16 from the copied position); +D duplicates the selection directly
 *  (copy+paste in one step, independent of whatever's already in the clipboard). All three
 *  preventDefault so the browser's own clipboard handling / bookmark dialog never fires. */
export function useClipboardKeys() {
  const { state, dispatch } = useGraph();
  const { selectedNodeIds, clipboard, setClipboard } = useUI();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((document.activeElement as Element).getAttribute('contenteditable') === 'true') return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key !== 'c' && key !== 'v' && key !== 'd') return;
      e.preventDefault();

      if (key === 'c') {
        if (selectedNodeIds.length) setClipboard(snapshotSelection(state, selectedNodeIds));
        return;
      }
      const clip = key === 'd'
        ? (selectedNodeIds.length ? snapshotSelection(state, selectedNodeIds) : null)
        : clipboard;
      if (clip) dispatch({ type: 'ADD_ITEMS', ...offsetClipboard(clip) });
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [state, selectedNodeIds, clipboard, setClipboard, dispatch]);
}
