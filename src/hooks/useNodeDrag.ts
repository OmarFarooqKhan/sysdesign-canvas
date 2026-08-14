import { useRef, useState } from 'react';
import type { GraphNode } from '../types';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { useViewport } from '../store/ViewportContext';
import { usePointerDrag } from './usePointerDrag';
import { nodeSnapshot, offsetSnapshot, type NodeSnapshot } from '../lib/selection';
import { alignmentGuides } from '../lib/snap';
import type { GuideLines } from '../components/Guides';

/** Drags a node, moving its whole multi-selection together when it's part of one. Candidate
 *  positions pass through grid/alignment snapping (see lib/snap.ts) unless Alt is held; the
 *  snapped delta for the anchor node is then applied uniformly to the whole group. */
export function useNodeDrag(node: GraphNode) {
  const { state, dispatch } = useGraph();
  const { selectedNodeIds } = useUI();
  const { zoom } = useViewport();
  const startRef = useRef({ x: node.x, y: node.y });
  const groupRef = useRef<NodeSnapshot[] | null>(null);
  const [guides, setGuides] = useState<GuideLines | null>(null);

  const onMouseDown = usePointerDrag({
    onStart: () => {
      startRef.current = { x: node.x, y: node.y };
      const isGroup = selectedNodeIds.length > 1 && selectedNodeIds.includes(node.id);
      groupRef.current = isGroup ? nodeSnapshot(state.nodes, selectedNodeIds) : null;
    },
    onMove: (dx, dy, ev) => {
      const rawX = startRef.current.x + dx / zoom;
      const rawY = startRef.current.y + dy / zoom;
      let x = rawX;
      let y = rawY;
      if (ev.altKey) {
        setGuides(null);
      } else {
        const excluded = new Set(groupRef.current ? groupRef.current.map((g) => g.id) : [node.id]);
        const others = Object.values(state.nodes).filter((n) => !excluded.has(n.id));
        const snap = alignmentGuides({ x: rawX, y: rawY }, others);
        x = snap.x; y = snap.y;
        setGuides({ vertical: snap.vertical, horizontal: snap.horizontal });
      }
      dispatch(groupRef.current
        ? { type: 'MOVE_NODES', moves: offsetSnapshot(groupRef.current, x - startRef.current.x, y - startRef.current.y) }
        : { type: 'MOVE_NODE', id: node.id, x, y });
    },
    onEnd: () => { setGuides(null); dispatch({ type: 'END_SESSION' }); },
  });

  return { onMouseDown, guides };
}
