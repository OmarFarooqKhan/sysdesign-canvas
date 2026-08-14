import { createPortal } from 'react-dom';
import type { GraphNode } from '../types';
import { useGraph } from '../store/GraphContext';
import { hasWalkStep } from '../lib/playthrough';
import { ContextMenu, type MenuItem } from './ContextMenu';

/** NodeView's right-click menu, portaled onto document.body: notes plus
 *  playthrough-step authoring (add/edit always; remove only when the node has a
 *  step). Split out of NodeView.tsx to keep it under the line cap. */
export function NodeMenu({ node, pos, onClose, onNotes, onWalk }: {
  node: GraphNode;
  pos: { x: number; y: number };
  onClose: () => void;
  onNotes: () => void;
  onWalk: () => void;
}) {
  const { state, dispatch } = useGraph();
  const items: MenuItem[] = [
    { label: '✎ Notes…', onClick: onNotes },
    { label: '▶ Playthrough step…', onClick: onWalk },
  ];
  if (hasWalkStep(state, node.id)) {
    items.push({
      label: '🗑 Remove playthrough step',
      danger: true,
      onClick: () => dispatch({ type: 'REMOVE_WALK_STEP', nodeId: node.id }),
    });
  }
  return createPortal(<ContextMenu x={pos.x} y={pos.y} items={items} onClose={onClose} />, document.body);
}
