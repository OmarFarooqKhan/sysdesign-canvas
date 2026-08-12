import { describe, expect, it } from 'vitest';
import { initHistory, makeHistoryReducer } from './history';

// Minimal counter reducer: ADD adds n; SET_TO replaces (session-style).
type A = { type: 'ADD'; n: number } | { type: 'SET'; v: number } | { type: 'NOOP' };
const reducer = (s: number, a: A): number =>
  a.type === 'ADD' ? s + a.n : a.type === 'SET' ? a.v : s;
const isSession = (a: A) => a.type === 'SET';
const hr = makeHistoryReducer(reducer, isSession);

describe('history reducer', () => {
  it('pushes discrete entries and undoes/redoes them', () => {
    let h = initHistory(0);
    h = hr(h, { type: 'ADD', n: 5 });
    h = hr(h, { type: 'ADD', n: 3 });
    expect(h.present).toBe(8);
    h = hr(h, { type: 'UNDO' });
    expect(h.present).toBe(5);
    h = hr(h, { type: 'REDO' });
    expect(h.present).toBe(8);
  });

  it('UNDO/REDO on empty stacks are no-ops', () => {
    const h = initHistory(1);
    expect(hr(h, { type: 'UNDO' })).toBe(h);
    expect(hr(h, { type: 'REDO' })).toBe(h);
  });

  it('ignores no-op actions (no history entry)', () => {
    const h = initHistory(1);
    expect(hr(h, { type: 'NOOP' })).toBe(h);
  });

  it('coalesces a session into one entry until END_SESSION', () => {
    let h = initHistory(0);
    h = hr(h, { type: 'SET', v: 1 });
    h = hr(h, { type: 'SET', v: 2 });
    h = hr(h, { type: 'SET', v: 3 });
    expect(h.present).toBe(3);
    expect(h.past).toHaveLength(1); // single baseline (0)
    h = hr(h, { type: 'UNDO' });
    expect(h.present).toBe(0);
  });

  it('END_SESSION closes the group so the next session is separate', () => {
    let h = initHistory(0);
    h = hr(h, { type: 'SET', v: 1 });
    h = hr(h, { type: 'END_SESSION' });
    expect(h.session).toBe(false);
    h = hr(h, { type: 'SET', v: 2 });
    expect(h.past).toHaveLength(2);
    h = hr(h, { type: 'END_SESSION' }); // close it (session true -> false)
    expect(h.session).toBe(false);
    // a further END_SESSION with no open session is a true no-op (same ref)
    expect(hr(h, { type: 'END_SESSION' })).toBe(h);
  });

  it('a new action after undo clears the redo future', () => {
    let h = initHistory(0);
    h = hr(h, { type: 'ADD', n: 1 });
    h = hr(h, { type: 'UNDO' });
    expect(h.future).toHaveLength(1);
    h = hr(h, { type: 'ADD', n: 9 });
    expect(h.future).toHaveLength(0);
    expect(h.present).toBe(9);
  });
});
