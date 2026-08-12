import { useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { Region } from '../types';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { useViewport } from '../store/ViewportContext';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { textOf } from '../lib/dom';

export function RegionView({ region }: { region: Region }) {
  const { dispatch } = useGraph();
  const { selectedRegionId, selectRegion } = useUI();
  const { zoom } = useViewport();
  const [editable, setEditable] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: region.x, y: region.y });
  const startSize = useRef({ w: region.w, h: region.h });

  const endSession = () => dispatch({ type: 'END_SESSION' });

  const dragMove = usePointerDrag({
    onStart: () => { startPos.current = { x: region.x, y: region.y }; },
    onMove: (dx, dy) => dispatch({
      type: 'MOVE_REGION', id: region.id,
      x: Math.max(0, startPos.current.x + dx / zoom), y: Math.max(0, startPos.current.y + dy / zoom),
    }),
    onEnd: endSession,
  });

  const dragResize = usePointerDrag({
    onStart: () => { startSize.current = { w: region.w, h: region.h }; },
    onMove: (dx, dy) => dispatch({
      type: 'RESIZE_REGION', id: region.id,
      w: startSize.current.w + dx / zoom, h: startSize.current.h + dy / zoom,
    }),
    onEnd: endSession,
  });

  const handleRootMouseDown = (e: ReactMouseEvent) => {
    if (e.target === e.currentTarget) selectRegion(region.id);
  };

  const handleTitleMouseDown = (e: ReactMouseEvent) => {
    if (editable) return;
    selectRegion(region.id);
    dragMove(e);
  };

  const handleTitleDoubleClick = () => {
    setEditable(true);
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  const handleTitleBlur = () => {
    setEditable(false);
    dispatch({ type: 'RENAME_REGION', id: region.id, title: textOf(titleRef.current) });
  };

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); titleRef.current?.blur(); }
  };

  const handleDelete = (e: ReactMouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_REGION', id: region.id });
  };

  const className = `region${selectedRegionId === region.id ? ' selected' : ''}`;

  return (
    <div
      className={className}
      onMouseDown={handleRootMouseDown}
      style={{
        left: region.x,
        top: region.y,
        width: region.w,
        height: region.h,
        ['--reg' as any]: region.color,
      }}
    >
      <div
        ref={titleRef}
        className="r-title"
        contentEditable={editable}
        suppressContentEditableWarning
        onMouseDown={handleTitleMouseDown}
        onDoubleClick={handleTitleDoubleClick}
        onBlur={handleTitleBlur}
        onKeyDown={handleTitleKeyDown}
      >
        {region.title}
      </div>
      <button className="r-del" onClick={handleDelete}>
        ✕
      </button>
      <div className="r-resize" onMouseDown={dragResize} />
    </div>
  );
}
