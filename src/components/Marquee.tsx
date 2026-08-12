import { useRef, useState } from 'react';
import type { Rect } from '../lib/selection';
import { nodesInRect, rectFromPoints } from '../lib/selection';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { useViewport } from '../store/ViewportContext';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { screenToCanvas } from '../lib/viewport';

/**
 * Drag-to-select on empty canvas. Returns an onMouseDown handler (wire it to
 * the canvas root's mousedown, gated on "click hit the background") plus the
 * in-progress rect for rendering, in canvas (zoom/pan-aware) coordinates.
 */
export function useMarquee() {
  const { state } = useGraph();
  const { selectNodes } = useUI();
  const { zoom, panX, panY, canvasRef } = useViewport();
  const [rect, setRect] = useState<Rect | null>(null);
  const rectRef = useRef<Rect | null>(null);

  const onMouseDown = usePointerDrag({
    onMove: (dx, dy, ev) => {
      const r = canvasRef.current!.getBoundingClientRect();
      const start = screenToCanvas(ev.clientX - dx, ev.clientY - dy, r, { zoom, panX, panY });
      const end = screenToCanvas(ev.clientX, ev.clientY, r, { zoom, panX, panY });
      const rect = rectFromPoints(start.x, start.y, end.x, end.y);
      rectRef.current = rect;
      setRect(rect);
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
