import { useRef, useState } from 'react';
import type { Rect } from '../lib/geometry';
import { nodesInRect, rectFromPoints } from '../lib/geometry';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { usePointerDrag } from '../hooks/usePointerDrag';

/**
 * Drag-to-select on empty canvas. Returns an onMouseDown handler (wire it to
 * the canvas root's mousedown, gated on "click hit the background") plus the
 * in-progress rect for rendering.
 *
 * Coordinates are raw client coords for now — no zoom/pan transform exists
 * yet in this codebase. Once the viewport lands, convert the drag points to
 * canvas coordinates before calling `rectFromPoints`; `nodesInRect` and the
 * rest of this hook need no other changes.
 */
export function useMarquee() {
  const { state } = useGraph();
  const { selectNodes } = useUI();
  const [rect, setRect] = useState<Rect | null>(null);
  const rectRef = useRef<Rect | null>(null);

  const onMouseDown = usePointerDrag({
    onMove: (dx, dy, ev) => {
      const r = rectFromPoints(ev.clientX - dx, ev.clientY - dy, ev.clientX, ev.clientY);
      rectRef.current = r;
      setRect(r);
    },
    onEnd: () => {
      const ids = rectRef.current ? nodesInRect(Object.values(state.nodes), rectRef.current) : [];
      selectNodes(ids);
      rectRef.current = null;
      setRect(null);
    },
  });

  return { onMouseDown, rect };
}

/** The visual selection rectangle while a marquee drag is in progress. */
export function Marquee({ rect }: { rect: Rect | null }) {
  if (!rect) return null;
  return <div className="marquee" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} />;
}
