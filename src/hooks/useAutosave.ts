import { useEffect, useRef } from 'react';
import type { EdgeMode, GraphState } from '../types';
import { toData } from '../lib/io';
import { saveLocal } from '../lib/persist';

const DEBOUNCE_MS = 500;

/** Debounced autosave: persists graph state + edge mode to localStorage on every change after
 *  the initial mount value. Skipping the mount value matters when it came from a share link:
 *  merely viewing it must not overwrite the user's own autosave — only editing it should.
 *  Compared by reference (not a mutable "seen once" flag) so React's StrictMode dev-only double
 *  effect invocation on mount — same values, no real change — can't defeat the skip. */
export function useAutosave(state: GraphState, edgeMode: EdgeMode): void {
  const initial = useRef({ state, edgeMode });

  useEffect(() => {
    if (state === initial.current.state && edgeMode === initial.current.edgeMode) return;
    const id = setTimeout(() => saveLocal(toData(state, edgeMode)), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [state, edgeMode]);
}
