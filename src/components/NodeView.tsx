import { useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { GraphNode } from '../types';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { textOf } from '../lib/dom';
import { nodeSnapshot, offsetSnapshot, type NodeSnapshot } from '../lib/geometry';
import { Icon } from './Icon';
import { LinkPreview } from './LinkPreview';

/** Node id currently being dragged from its port to form an edge, if any. */
let linkSource: string | null = null;

export function NodeView({ node }: { node: GraphNode }) {
  const { state, dispatch } = useGraph();
  const { selectedNodeIds, selectNode } = useUI();
  const startRef = useRef({ x: node.x, y: node.y });
  const groupRef = useRef<NodeSnapshot[] | null>(null);
  const linkStartRef = useRef({ x: 0, y: 0 });
  const labelRef = useRef<HTMLDivElement>(null);
  const [linking, setLinking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tempLine, setTempLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  const dragNode = usePointerDrag({
    onStart: () => {
      startRef.current = { x: node.x, y: node.y };
      const isGroup = selectedNodeIds.length > 1 && selectedNodeIds.includes(node.id);
      groupRef.current = isGroup ? nodeSnapshot(state.nodes, selectedNodeIds) : null;
    },
    onMove: (dx, dy) => dispatch(groupRef.current
      ? { type: 'MOVE_NODES', moves: offsetSnapshot(groupRef.current, dx, dy) }
      : { type: 'MOVE_NODE', id: node.id, x: Math.max(0, startRef.current.x + dx), y: Math.max(0, startRef.current.y + dy) }),
    onEnd: () => dispatch({ type: 'END_SESSION' }),
  });

  const dragLink = usePointerDrag({
    onStart: () => { linkSource = node.id; setLinking(true); },
    onMove: (_dx, _dy, ev) => setTempLine({
      x1: linkStartRef.current.x, y1: linkStartRef.current.y, x2: ev.clientX, y2: ev.clientY,
    }),
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
    linkStartRef.current = { x: e.clientX, y: e.clientY };
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
