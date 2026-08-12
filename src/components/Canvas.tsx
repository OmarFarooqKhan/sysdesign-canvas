import { useRef } from 'react';
import type { DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { NodeDef } from '../types';
import { useGraph } from '../store/GraphContext';
import { useViewport } from '../store/ViewportContext';
import { useKeyboard } from '../hooks/useKeyboard';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { screenToCanvas } from '../lib/viewport';
import { EdgeLayer } from './EdgeLayer';
import { NodeView } from './NodeView';
import { RegionView } from './RegionView';
import { EmptyState } from './EmptyState';
import { ZoomControls } from './ZoomControls';
import { Marquee, useMarquee } from './Marquee';

/** The diagram surface: drop target for new nodes, hosts edges/regions/nodes. */
export function Canvas() {
  const { state, dispatch } = useGraph();
  const { zoom, panX, panY, panMode, canvasRef, setViewport } = useViewport();
  useKeyboard();
  const panStart = useRef({ x: 0, y: 0 });
  const { onMouseDown: startMarquee, rect: marqueeRect } = useMarquee();

  const onDrop = (e: ReactDragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    const def = JSON.parse(raw) as NodeDef;
    const r = e.currentTarget.getBoundingClientRect();
    const p = screenToCanvas(e.clientX, e.clientY, r, { zoom, panX, panY });
    dispatch({ type: 'ADD_NODE', def, x: p.x - 48, y: p.y - 32 });
  };

  const dragPan = usePointerDrag({
    onStart: () => { panStart.current = { x: panX, y: panY }; },
    onMove: (dx, dy) => setViewport({ panX: panStart.current.x + dx, panY: panStart.current.y + dy }),
  });

  // In pan mode, intercept mousedown/click in the capture phase so nothing underneath
  // (nodes, regions, edges) can select, move, or deselect — only the camera moves.
  const onCaptureMouseDown = (e: ReactMouseEvent) => {
    if (!panMode) return;
    e.stopPropagation();
    dragPan(e);
  };
  const onCaptureClick = (e: ReactMouseEvent) => { if (panMode) e.stopPropagation(); };

  const onMouseDown = (e: ReactMouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === e.currentTarget || target.classList.contains('canvas-inner')) startMarquee(e);
  };

  const cls = ['canvas', panMode && 'pan-mode'].filter(Boolean).join(' ');
  const innerStyle = { transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: '0 0' };

  return (
    <div
      className={cls}
      ref={canvasRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onMouseDownCapture={onCaptureMouseDown}
      onClickCapture={onCaptureClick}
      onMouseDown={onMouseDown}
    >
      <div className="canvas-inner" style={innerStyle}>
        <EdgeLayer />
        {state.regions.map((r) => <RegionView key={r.id} region={r} />)}
        {Object.values(state.nodes).map((n) => <NodeView key={n.id} node={n} />)}
        <Marquee rect={marqueeRect} />
      </div>
      <EmptyState />
      <ZoomControls />
    </div>
  );
}
