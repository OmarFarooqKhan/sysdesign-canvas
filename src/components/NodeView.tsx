import { useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { GraphNode } from '../types';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { usePlaythrough } from '../store/PlaythroughContext';
import { useNodeDrag } from '../hooks/useNodeDrag';
import { useLinkDrag } from '../hooks/useLinkDrag';
import { activeStepNodeId, hasWalkStep } from '../lib/playthrough';
import { Icon } from './Icon';
import { LinkPreview } from './LinkPreview';
import { Guides } from './Guides';
import { NodeLabel } from './NodeLabel';
import { NodeMenu } from './NodeMenu';
import { NotesEditor } from './NotesEditor';
import { WalkStepEditor } from './WalkStepEditor';
import { DbInspector } from './db/DbInspector';
import { dbTableCount, isDbNode } from './db/dbModel';

export function NodeView({ node }: { node: GraphNode }) {
  const { state } = useGraph();
  const { selectedNodeIds, selectNode } = useUI();
  const { playing, stepIndex } = usePlaythrough();
  const [dbOpen, setDbOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [walkOpen, setWalkOpen] = useState(false);

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

  const onNodeContextMenu = (e: ReactMouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const dbCount = dbTableCount(node);
  const cls = [
    'node', selectedNodeIds.includes(node.id) && 'selected', linking && 'linking',
    dbCount > 0 && 'has-data', node.notes && 'has-notes',
    playing && activeStepNodeId(state, stepIndex) === node.id && 'walk-active',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div
        className={cls}
        data-id={node.id}
        style={{ left: node.x, top: node.y }}
        onMouseUp={onRootMouseUp}
        onContextMenu={onNodeContextMenu}
      >
        <div className="box" onMouseDown={onBoxMouseDown} onDoubleClick={onBoxDoubleClick}>
          <Icon name={node.icon} />
          <div className="port" onMouseDown={onPortMouseDown} />
          {dbCount > 0 && <span className="db-badge">{dbCount}</span>}
          {node.notes && <span className="notes-badge" title={node.notes}>📝</span>}
          {hasWalkStep(state, node.id) && <span className="walk-badge">▶</span>}
        </div>
        <NodeLabel node={node} />
        {tempLine && <LinkPreview {...tempLine} />}
        {dbOpen && <DbInspector node={node} onClose={() => setDbOpen(false)} />}
        {notesOpen && <NotesEditor node={node} onClose={() => setNotesOpen(false)} />}
        {walkOpen && <WalkStepEditor node={node} onClose={() => setWalkOpen(false)} />}
      </div>
      {guides && <Guides guides={guides} />}
      {menuPos && (
        <NodeMenu
          node={node}
          pos={menuPos}
          onClose={() => setMenuPos(null)}
          onNotes={() => setNotesOpen(true)}
          onWalk={() => setWalkOpen(true)}
        />
      )}
    </>
  );
}
