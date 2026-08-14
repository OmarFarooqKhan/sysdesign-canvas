import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { useAutosave } from '../../hooks/useAutosave';
import type { EdgeMode, GraphState } from '../../types';

const { saveLocalMock } = vi.hoisted(() => ({ saveLocalMock: vi.fn() }));
vi.mock('../../lib/persist', () => ({ saveLocal: saveLocalMock }));

const makeState = (label: string): GraphState => ({
  nodes: { n1: { id: 'n1', key: 'a', icon: 'a', label, x: 0, y: 0 } },
  edges: [],
  regions: [],
  seq: 1,
});

function Harness({ state, edgeMode }: { state: GraphState; edgeMode: EdgeMode }) {
  useAutosave(state, edgeMode);
  return null;
}

beforeEach(() => {
  vi.useFakeTimers();
  saveLocalMock.mockClear();
});
afterEach(() => vi.useRealTimers());

describe('useAutosave', () => {
  it('does not save on the initial mount (so merely viewing a loaded diagram — e.g. from a share link — does not overwrite storage)', () => {
    render(<Harness state={makeState('A')} edgeMode="curved" />);
    vi.advanceTimersByTime(500);
    expect(saveLocalMock).not.toHaveBeenCalled();
  });

  it('saves after the debounce window following a state change', () => {
    const { rerender } = render(<Harness state={makeState('A')} edgeMode="curved" />);
    rerender(<Harness state={makeState('B')} edgeMode="curved" />);
    expect(saveLocalMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(saveLocalMock).toHaveBeenCalledTimes(1);
    expect(saveLocalMock.mock.calls[0][0]).toMatchObject({ edgeMode: 'curved', nodes: [{ label: 'B' }] });
  });

  it('coalesces rapid changes into a single save', () => {
    const { rerender } = render(<Harness state={makeState('A')} edgeMode="curved" />);
    rerender(<Harness state={makeState('B')} edgeMode="curved" />);
    vi.advanceTimersByTime(300);
    rerender(<Harness state={makeState('C')} edgeMode="curved" />);
    vi.advanceTimersByTime(300);
    expect(saveLocalMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(saveLocalMock).toHaveBeenCalledTimes(1);
    expect(saveLocalMock.mock.calls[0][0]).toMatchObject({ nodes: [{ label: 'C' }] });
  });

  it('does not save after unmount (a pending timer is cleared)', () => {
    const { rerender, unmount } = render(<Harness state={makeState('A')} edgeMode="curved" />);
    rerender(<Harness state={makeState('B')} edgeMode="curved" />);
    unmount();
    vi.advanceTimersByTime(500);
    expect(saveLocalMock).not.toHaveBeenCalled();
  });

  it('under StrictMode\'s dev-only double effect invocation on mount, still does not save the mount value', () => {
    // Regression test: an earlier "seen once" mutable-ref guard was defeated by StrictMode
    // replaying the mount effect (same values, no real change), causing a spurious save —
    // e.g. a share link's diagram silently overwriting the user's own autosave on open.
    render(
      <StrictMode>
        <Harness state={makeState('A')} edgeMode="curved" />
      </StrictMode>,
    );
    vi.advanceTimersByTime(500);
    expect(saveLocalMock).not.toHaveBeenCalled();
  });
});
