import type { GraphState, WalkStep } from '../types';
import type { GraphAction } from './actions';

export type WalkAction = Extract<GraphAction,
  { type: 'SET_WALK_STEP' | 'REMOVE_WALK_STEP' | 'MOVE_WALK_STEP' }>;

/** Handles the walkthrough-shaped subset of graph actions; split out of
 *  graphReducer.ts (like nodeReducer.ts) to stay under the line cap. All are
 *  undoable and none are session actions. DELETE_NODE deliberately never touches
 *  `walkthrough` — orphaned steps are skipped at playback by the resolver. */
export function walkReducer(s: GraphState, a: WalkAction): GraphState {
  const steps = s.walkthrough ?? [];
  switch (a.type) {
    case 'SET_WALK_STEP': {
      // One step per node (v1), so setting is an upsert: replace the node's
      // existing step text in place, or append a fresh step.
      const walkthrough: WalkStep[] = steps.some((w) => w.nodeId === a.nodeId)
        ? steps.map((w) => (w.nodeId === a.nodeId ? { ...w, text: a.text } : w))
        : [...steps, { nodeId: a.nodeId, text: a.text }];
      return { ...s, walkthrough };
    }
    case 'REMOVE_WALK_STEP': {
      if (!steps.some((w) => w.nodeId === a.nodeId)) return s;
      return { ...s, walkthrough: steps.filter((w) => w.nodeId !== a.nodeId) };
    }
    case 'MOVE_WALK_STEP': {
      if (a.from < 0 || a.from >= steps.length || a.to < 0 || a.to >= steps.length || a.from === a.to) return s;
      const walkthrough = [...steps];
      const [moved] = walkthrough.splice(a.from, 1);
      walkthrough.splice(a.to, 0, moved);
      return { ...s, walkthrough };
    }
  }
}
