import { useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { GraphNode } from '../types';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { useNodeDrag } from '../hooks/useNodeDrag';
import { useLinkDrag } from '../hooks/useLinkDrag';
import { textOf } from '../lib/dom';
import { Icon } from './Icon';
import { LinkPreview } from './LinkPreview';
import { Guides } from './Guides';
import { DbInspector } from './db/DbInspector';
import { dbTableCount, isDbNode } from './db/dbModel';

export function NodeView({ node }: { node: GraphNode }) {
  const { dispatch } = useGraph();
  const { selectedNodeIds, selectNode } = useUI();
  const labelRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [dbOpen, setDbOpen] = useState(false);

  const { onMouseDown: dragNode, guides } = useNodeDrag(node);
  const { linking, tempLine, onPortMouseDown, onRootMouseUp } = useLinkDrag(node);

  const onBoxMouseDown = (e: ReactMouseEvent) => {
    if ((e.target as HTMLElement).closest('.port')) return;
    // Keep an existing multi-selection intact when starting a drag on one of its members.
    if (!(selectedNodeIds.length > 1 && selectedNodeIds.includes(node.id))) selectNode(node.id);
    dragNode(e);
  };

  const onBoxDoubleClick = (e: ReactMouseEvent) => {
    if (!(e.target as HTMLElement).closest('.port') && isDbNode(node.key)) setDbOpen(true);
  };

  const onLabelBlur = () => {
    setEditing(false); dispatch({ type: 'RENAME_NODE', id: node.id, label: textOf(labelRef.current) });
  };

  const onLabelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); labelRef.current?.blur(); }
  };

  const dbCount = dbTableCount(node);
  const cls = [
    'node', selectedNodeIds.includes(node.id) && 'selected', linking && 'linking', dbCount > 0 && 'has-data',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={cls} data-id={node.id} style={{ left: node.x, top: node.y }} onMouseUp={onRootMouseUp}>
        <div className="box" onMouseDown={onBoxMouseDown} onDoubleClick={onBoxDoubleClick}>
          <Icon name={node.icon} />
          <div className="port" onMouseDown={onPortMouseDown} />
          {dbCount > 0 && <span className="db-badge">{dbCount}</span>}
        </div>
        <div
          ref={labelRef}
          className="label"
          contentEditable={editing}
          suppressContentEditableWarning
          onDoubleClick={() => setEditing(true)}
          onBlur={onLabelBlur}
          onKeyDown={onLabelKeyDown}
        >{node.label}</div>
        {tempLine && <LinkPreview {...tempLine} />}
        {dbOpen && <DbInspector node={node} onClose={() => setDbOpen(false)} />}
      </div>
      {guides && <Guides guides={guides} />}
    </>
  );
}
