import { useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { GraphNode } from '../types';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { useViewport } from '../store/ViewportContext';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { useNodeDrag } from '../hooks/useNodeDrag';
import { screenToLocal } from '../lib/viewport';
import { textOf } from '../lib/dom';
import { Icon } from './Icon';
import { LinkPreview } from './LinkPreview';

/** Node id currently being dragged from its port to form an edge, if any. */
let linkSource: string | null = null;

export function NodeView({ node }: { node: GraphNode }) {
  const { dispatch } = useGraph();
  const { selectedNodeIds, selectNode } = useUI();
  const { zoom, panX, panY, canvasRef } = useViewport();
  const linkStartRef = useRef({ x: 0, y: 0 });
  const labelRef = useRef<HTMLDivElement>(null);
  const [linking, setLinking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tempLine, setTempLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Client coords -> canvas coords, relative to this node's own x/y (see LinkPreview).
  const toLocal = (clientX: number, clientY: number) =>
    screenToLocal(clientX, clientY, canvasRef.current?.getBoundingClientRect(), { zoom, panX, panY }, node.x, node.y);

  const dragNode = useNodeDrag(node);

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

  const onBoxMouseDown = (e: ReactMouseEvent) => {
    if ((e.target as HTMLElement).closest('.port')) return;
    // Keep an existing multi-selection intact when starting a drag on one of its members.
    if (!(selectedNodeIds.length > 1 && selectedNodeIds.includes(node.id))) selectNode(node.id);
    dragNode(e);
  };

  const onPortMouseDown = (e: ReactMouseEvent) => {
    linkStartRef.current = toLocal(e.clientX, e.clientY);
    dragLink(e);
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

  const cls = ['node', selectedNodeIds.includes(node.id) && 'selected', linking && 'linking'].filter(Boolean).join(' ');

  return (
    <div className={cls} data-id={node.id} style={{ left: node.x, top: node.y }} onMouseUp={onRootMouseUp}>
      <div className="box" onMouseDown={onBoxMouseDown}>
        <Icon name={node.icon} />
        <div className="port" onMouseDown={onPortMouseDown} />
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
      {tempLine && <LinkPreview {...tempLine} />}
    </div>
  );
}
