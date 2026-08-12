import { useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { GraphNode } from '../types';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { textOf } from '../lib/dom';
import { Icon } from './Icon';

/** Node id currently being dragged from its port to form an edge, if any. */
let linkSource: string | null = null;

export function NodeView({ node }: { node: GraphNode }) {
  const { dispatch } = useGraph();
  const { selectedId, selectNode } = useUI();
  const startRef = useRef({ x: node.x, y: node.y });
  const labelRef = useRef<HTMLDivElement>(null);
  const [linking, setLinking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tempLine, setTempLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  const dragNode = usePointerDrag({
    onStart: () => { startRef.current = { x: node.x, y: node.y }; },
    onMove: (dx, dy) => dispatch({
      type: 'MOVE_NODE', id: node.id,
      x: Math.max(0, startRef.current.x + dx), y: Math.max(0, startRef.current.y + dy),
    }),
    onEnd: () => dispatch({ type: 'END_SESSION' }),
  });

  const dragLink = usePointerDrag({
    onStart: () => { linkSource = node.id; setLinking(true); },
    onMove: (_dx, _dy, ev) => setTempLine({ x1: ev.clientX, y1: ev.clientY, x2: ev.clientX, y2: ev.clientY }),
    onEnd: () => {
      setLinking(false);
      setTempLine(null);
      queueMicrotask(() => { linkSource = null; });
    },
  });

  const onBoxMouseDown = (e: ReactMouseEvent) => {
    if ((e.target as HTMLElement).closest('.port')) return;
    selectNode(node.id);
    dragNode(e);
  };

  const onRootMouseUp = () => {
    if (linkSource && linkSource !== node.id) dispatch({ type: 'ADD_EDGE', from: linkSource, to: node.id });
    linkSource = null;
  };

  const onLabelBlur = () => {
    setEditing(false);
    dispatch({ type: 'RENAME_NODE', id: node.id, label: textOf(labelRef.current) });
  };

  const onLabelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); labelRef.current?.blur(); }
  };

  const cls = ['node', selectedId === node.id && 'selected', linking && 'linking'].filter(Boolean).join(' ');

  return (
    <div className={cls} data-id={node.id} style={{ left: node.x, top: node.y }} onMouseUp={onRootMouseUp}>
      <div className="box" onMouseDown={onBoxMouseDown}>
        <Icon name={node.icon} />
        <div className="port" onMouseDown={dragLink} />
      </div>
      <div
        ref={labelRef}
        className="label"
        contentEditable={editing}
        suppressContentEditableWarning
        onDoubleClick={() => setEditing(true)}
        onBlur={onLabelBlur}
        onKeyDown={onLabelKeyDown}
      >
        {node.label}
      </div>
      {tempLine && (
        <svg style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50 }}>
          <line x1={tempLine.x1} y1={tempLine.y1} x2={tempLine.x2} y2={tempLine.y2} stroke="#34d399" strokeWidth={2} />
        </svg>
      )}
    </div>
  );
}
