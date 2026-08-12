import { useRef } from 'react';
import type { GraphNode } from '../types';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { useViewport } from '../store/ViewportContext';
import { usePointerDrag } from './usePointerDrag';
import { nodeSnapshot, offsetSnapshot, type NodeSnapshot } from '../lib/selection';

/** Drags a node, moving its whole multi-selection together when it's part of one. */
export function useNodeDrag(node: GraphNode) {
  const { state, dispatch } = useGraph();
  const { selectedNodeIds } = useUI();
  const { zoom } = useViewport();
  const startRef = useRef({ x: node.x, y: node.y });
  const groupRef = useRef<NodeSnapshot[] | null>(null);

  return usePointerDrag({
    onStart: () => {
      startRef.current = { x: node.x, y: node.y };
      const isGroup = selectedNodeIds.length > 1 && selectedNodeIds.includes(node.id);
      groupRef.current = isGroup ? nodeSnapshot(state.nodes, selectedNodeIds) : null;
    },
    onMove: (dx, dy) => dispatch(groupRef.current
      ? { type: 'MOVE_NODES', moves: offsetSnapshot(groupRef.current, dx / zoom, dy / zoom) }
      : {
          type: 'MOVE_NODE', id: node.id,
          x: Math.max(0, startRef.current.x + dx / zoom), y: Math.max(0, startRef.current.y + dy / zoom),
        }),
    onEnd: () => dispatch({ type: 'END_SESSION' }),
  });
}
