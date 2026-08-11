import { createContext, useContext, useReducer } from 'react';
import type { Dispatch, ReactNode } from 'react';
import type { GraphState } from '../types';
import { graphReducer } from './graphReducer';
import { type GraphAction, emptyGraph, isSessionAction } from './actions';
import { type History, type HistoryAction, initHistory, makeHistoryReducer } from './history';

const reducer = makeHistoryReducer<GraphState, GraphAction>(graphReducer, isSessionAction);

export interface GraphContextValue {
  state: GraphState;
  dispatch: Dispatch<HistoryAction<GraphAction>>;
  canUndo: boolean;
  canRedo: boolean;
}

const Ctx = createContext<GraphContextValue | null>(null);

export function GraphProvider({ children, initial }: { children: ReactNode; initial?: GraphState }) {
  const start: History<GraphState> = initHistory(initial ?? emptyGraph());
  const [hist, dispatch] = useReducer(reducer, start);
  const value: GraphContextValue = {
    state: hist.present,
    dispatch,
    canUndo: hist.past.length > 0,
    canRedo: hist.future.length > 0,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGraph(): GraphContextValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('useGraph must be used within a GraphProvider');
  return c;
}
