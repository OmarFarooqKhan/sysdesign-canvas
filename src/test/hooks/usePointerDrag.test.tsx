import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { usePointerDrag } from './usePointerDrag';
import type { DragHandlers } from './usePointerDrag';

function Draggable({ handlers, label }: { handlers: DragHandlers; label: string }) {
  const onMouseDown = usePointerDrag(handlers);
  return <button onMouseDown={onMouseDown}>{label}</button>;
}

describe('usePointerDrag', () => {
  it('reports deltas from the press point and fires start/move/end', () => {
    const onStart = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();
    render(<Draggable label="a" handlers={{ onStart, onMove, onEnd }} />);
    fireEvent.mouseDown(screen.getByText('a'), { clientX: 100, clientY: 100 });
    expect(onStart).toHaveBeenCalledOnce();
    fireEvent.mouseMove(document, { clientX: 130, clientY: 120 });
    expect(onMove).toHaveBeenCalledWith(30, 20, expect.any(Object));
    fireEvent.mouseUp(document, { clientX: 130, clientY: 120 });
    expect(onEnd).toHaveBeenCalledOnce();
    // listeners removed after mouseup
    fireEvent.mouseMove(document, { clientX: 200, clientY: 200 });
    expect(onMove).toHaveBeenCalledOnce();
  });

  it('works without optional onStart/onEnd handlers', () => {
    const onMove = vi.fn();
    render(<Draggable label="b" handlers={{ onMove }} />);
    fireEvent.mouseDown(screen.getByText('b'), { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(document, { clientX: 5, clientY: 5 });
    fireEvent.mouseUp(document);
    expect(onMove).toHaveBeenCalledWith(5, 5, expect.any(Object));
  });
});
