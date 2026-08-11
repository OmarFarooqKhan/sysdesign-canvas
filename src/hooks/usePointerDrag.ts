import type { MouseEvent as ReactMouseEvent } from 'react';

export interface DragHandlers {
  onStart?: () => void;
  /** Called on each move with the delta from the press point. */
  onMove: (dx: number, dy: number, ev: MouseEvent) => void;
  onEnd?: (ev: MouseEvent) => void;
}

/**
 * Returns an onMouseDown handler that tracks a drag via window listeners and
 * reports deltas from the press point. Reused for node/region drag, region
 * resize, and port-linking.
 */
export function usePointerDrag(handlers: DragHandlers) {
  return (e: ReactMouseEvent) => {
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    handlers.onStart?.();
    const move = (ev: MouseEvent) => handlers.onMove(ev.clientX - sx, ev.clientY - sy, ev);
    const up = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      handlers.onEnd?.(ev);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };
}
