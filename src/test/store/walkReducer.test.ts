import { describe, expect, it } from 'vitest';
import { graphReducer } from '../../store/graphReducer';
import { emptyGraph, isSessionAction } from '../../store/actions';
import { initHistory, makeHistoryReducer } from '../../store/history';
import type { GraphState, WalkStep } from '../../types';

const step = (nodeId: string, text = nodeId): WalkStep => ({ nodeId, text });

const base = (walkthrough?: WalkStep[]): GraphState => ({
  nodes: {
    n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 10, y: 20 },
    n2: { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 100, y: 200 },
  },
  edges: [],
  regions: [],
  seq: 2,
  ...(walkthrough ? { walkthrough } : {}),
});

describe('walkReducer SET_WALK_STEP', () => {
  it('appends a first step when there is no walkthrough yet', () => {
    const out = graphReducer(base(), { type: 'SET_WALK_STEP', nodeId: 'n1', text: 'the request lands' });
    expect(out.walkthrough).toEqual([{ nodeId: 'n1', text: 'the request lands' }]);
  });

  it('appends after existing steps for a node without one', () => {
    const out = graphReducer(base([step('n1')]), { type: 'SET_WALK_STEP', nodeId: 'n2', text: 'hits the DB' });
    expect(out.walkthrough).toEqual([step('n1'), { nodeId: 'n2', text: 'hits the DB' }]);
  });

  it('upserts in place: replaces the node\'s text without reordering', () => {
    const out = graphReducer(base([step('n1'), step('n2')]), { type: 'SET_WALK_STEP', nodeId: 'n1', text: 'edited' });
    expect(out.walkthrough).toEqual([{ nodeId: 'n1', text: 'edited' }, step('n2')]);
  });
});

describe('walkReducer REMOVE_WALK_STEP', () => {
  it('drops the node\'s step', () => {
    const out = graphReducer(base([step('n1'), step('n2')]), { type: 'REMOVE_WALK_STEP', nodeId: 'n1' });
    expect(out.walkthrough).toEqual([step('n2')]);
  });

  it('is a no-op (same reference) for a node without a step, with or without a walkthrough', () => {
    const none = base();
    expect(graphReducer(none, { type: 'REMOVE_WALK_STEP', nodeId: 'n1' })).toBe(none);
    const some = base([step('n1')]);
    expect(graphReducer(some, { type: 'REMOVE_WALK_STEP', nodeId: 'n2' })).toBe(some);
  });
});

describe('walkReducer MOVE_WALK_STEP', () => {
  const three = () => base([step('a'), step('b'), step('c')]);

  it('reorders by index in both directions', () => {
    const fwd = graphReducer(three(), { type: 'MOVE_WALK_STEP', from: 0, to: 2 });
    expect(fwd.walkthrough!.map((w) => w.nodeId)).toEqual(['b', 'c', 'a']);
    const back = graphReducer(three(), { type: 'MOVE_WALK_STEP', from: 2, to: 0 });
    expect(back.walkthrough!.map((w) => w.nodeId)).toEqual(['c', 'a', 'b']);
  });

  it('is a no-op (same reference) for out-of-range or identical indices', () => {
    const s = three();
    expect(graphReducer(s, { type: 'MOVE_WALK_STEP', from: -1, to: 1 })).toBe(s);
    expect(graphReducer(s, { type: 'MOVE_WALK_STEP', from: 3, to: 1 })).toBe(s);
    expect(graphReducer(s, { type: 'MOVE_WALK_STEP', from: 1, to: -1 })).toBe(s);
    expect(graphReducer(s, { type: 'MOVE_WALK_STEP', from: 1, to: 3 })).toBe(s);
    expect(graphReducer(s, { type: 'MOVE_WALK_STEP', from: 1, to: 1 })).toBe(s);
  });
});

describe('walkthrough actions in the wider store', () => {
  it('none of the walkthrough actions are session actions (each is its own undo entry)', () => {
    expect(isSessionAction({ type: 'SET_WALK_STEP', nodeId: 'n1', text: 'x' })).toBe(false);
    expect(isSessionAction({ type: 'REMOVE_WALK_STEP', nodeId: 'n1' })).toBe(false);
    expect(isSessionAction({ type: 'MOVE_WALK_STEP', from: 0, to: 1 })).toBe(false);
  });

  it('DELETE_NODE leaves walkthrough untouched (orphans are skipped at playback)', () => {
    const out = graphReducer(base([step('n1'), step('n2')]), { type: 'DELETE_NODE', id: 'n1' });
    expect(out.nodes.n1).toBeUndefined();
    expect(out.walkthrough).toEqual([step('n1'), step('n2')]);
  });

  it('CLEAR resets to a graph without a walkthrough', () => {
    const out = graphReducer(base([step('n1')]), { type: 'CLEAR' });
    expect(out).toEqual(emptyGraph());
    expect('walkthrough' in out).toBe(false);
  });

  it('add -> edit -> remove all undo cleanly through the history wrapper', () => {
    const reducer = makeHistoryReducer(graphReducer, isSessionAction);
    let h = initHistory(base());
    h = reducer(h, { type: 'SET_WALK_STEP', nodeId: 'n1', text: 'v1' });
    h = reducer(h, { type: 'SET_WALK_STEP', nodeId: 'n1', text: 'v2' });
    h = reducer(h, { type: 'REMOVE_WALK_STEP', nodeId: 'n1' });
    expect(h.present.walkthrough).toEqual([]);
    h = reducer(h, { type: 'UNDO' });
    expect(h.present.walkthrough).toEqual([{ nodeId: 'n1', text: 'v2' }]);
    h = reducer(h, { type: 'UNDO' });
    expect(h.present.walkthrough).toEqual([{ nodeId: 'n1', text: 'v1' }]);
    h = reducer(h, { type: 'UNDO' });
    expect(h.present.walkthrough).toBeUndefined();
    h = reducer(h, { type: 'REDO' });
    expect(h.present.walkthrough).toEqual([{ nodeId: 'n1', text: 'v1' }]);
  });
});
