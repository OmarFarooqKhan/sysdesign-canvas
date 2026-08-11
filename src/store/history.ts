export interface History<S> {
  past: S[];
  present: S;
  future: S[];
  session: boolean;
}

export type HistoryAction<A> = A | { type: 'UNDO' } | { type: 'REDO' } | { type: 'END_SESSION' };

export function initHistory<S>(present: S): History<S> {
  return { past: [], present, future: [], session: false };
}

/**
 * Wrap a domain reducer with undo/redo. Session actions (drags/resizes)
 * coalesce into one entry: the first pushes a baseline, later ones replace
 * `present`, and END_SESSION closes the group so the next action starts fresh.
 */
export function makeHistoryReducer<S, A extends { type: string }>(
  reducer: (s: S, a: A) => S,
  isSession: (a: A) => boolean,
) {
  return function historyReducer(state: History<S>, action: HistoryAction<A>): History<S> {
    switch (action.type) {
      case 'UNDO': {
        if (!state.past.length) return state;
        const present = state.past[state.past.length - 1];
        return { past: state.past.slice(0, -1), present, future: [state.present, ...state.future], session: false };
      }
      case 'REDO': {
        if (!state.future.length) return state;
        const [present, ...future] = state.future;
        return { past: [...state.past, state.present], present, future, session: false };
      }
      case 'END_SESSION':
        return state.session ? { ...state, session: false } : state;
      default: {
        const a = action as A;
        const next = reducer(state.present, a);
        if (next === state.present) return state;
        if (isSession(a) && state.session) return { ...state, present: next };
        return { past: [...state.past, state.present], present: next, future: [], session: isSession(a) };
      }
    }
  };
}
