import { useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { GraphNode } from '../types';
import { useGraph } from '../store/GraphContext';
import { useViewport } from '../store/ViewportContext';
import { usePointerDrag } from './usePointerDrag';
import { screenToLocal } from '../lib/viewport';

/** Node id currently being dragged from its port to form an edge, if any. */
let linkSource: string | null = null;

/** Drags from a node's port to another node's root to create an edge. */
export function useLinkDrag(node: GraphNode) {
  const { dispatch } = useGraph();
  const { zoom, panX, panY, canvasRef } = useViewport();
  const linkStartRef = useRef({ x: 0, y: 0 });
  const [linking, setLinking] = useState(false);
  const [tempLine, setTempLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Client coords -> canvas coords, relative to this node's own x/y (see LinkPreview).
  const toLocal = (clientX: number, clientY: number) =>
    screenToLocal(clientX, clientY, canvasRef.current?.getBoundingClientRect(), { zoom, panX, panY }, node.x, node.y);

  const dragLink = usePointerDrag({
    onStart: () => { linkSource = node.id; setLinking(true); },
    onMove: (_dx, _dy, ev) => {
      const p = toLocal(ev.clientX, ev.clientY);
      setTempLine({ x1: linkStartRef.current.x, y1: linkStartRef.current.y, x2: p.x, y2: p.y });
    },
    onEnd: () => {
      setLinking(false);
      setTempLine(null);
      queueMicrotask(() => { linkSource = null; });
    },
  });

  const onPortMouseDown = (e: ReactMouseEvent) => {
    linkStartRef.current = toLocal(e.clientX, e.clientY);
    dragLink(e);
  };

  const onRootMouseUp = () => {
    if (linkSource && linkSource !== node.id) dispatch({ type: 'ADD_EDGE', from: linkSource, to: node.id });
    linkSource = null;
  };

  return { linking, tempLine, onPortMouseDown, onRootMouseUp };
}
