import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useGraph } from './GraphContext';
import { useUI } from './UIContext';
import { clampStep, resolveSteps } from '../lib/playthrough';

/** Ephemeral (non-undoable, non-serialized) playthrough player state, like
 *  `presenting`. The steps themselves live on the undoable graph. */
export interface PlaythroughContextValue {
  playing: boolean;
  stepIndex: number;
  start: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  goTo: (i: number) => void;
}

const Ctx = createContext<PlaythroughContextValue | null>(null);

export function PlaythroughProvider({ children }: { children: ReactNode }) {
  const { state } = useGraph();
  const { clearSelection } = useUI();
  const [playing, setPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const count = resolveSteps(state).length;

  // Entering clears any selection (like PresentButton) so no halo lingers.
  const start = useCallback(() => {
    clearSelection();
    setStepIndex(0);
    setPlaying(true);
  }, [clearSelection]);
  const stop = useCallback(() => setPlaying(false), []);
  const next = useCallback(() => setStepIndex((i) => clampStep(i + 1, count)), [count]);
  const prev = useCallback(() => setStepIndex((i) => clampStep(i - 1, count)), [count]);
  const goTo = useCallback((i: number) => setStepIndex(clampStep(i, count)), [count]);

  // While playing: Escape exits, arrows step. Registered in the capture phase so
  // it runs before ViewportContext's bubble-phase Escape listener; stopPropagation
  // then guarantees one Escape exits the playthrough only, leaving the user's
  // separate `presenting` toggle exactly as it was.
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); stop(); }
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [playing, stop, next, prev]);

  const value: PlaythroughContextValue = { playing, stepIndex, start, stop, next, prev, goTo };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlaythrough(): PlaythroughContextValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePlaythrough must be used within a PlaythroughProvider');
  return c;
}
