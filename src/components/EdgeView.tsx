import { useRef } from 'react';
import type { Edge, EdgeMode, GraphNode } from '../types';
import { useGraph } from '../store/GraphContext';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { edgeEndpoints, edgePath, insetEndpoints } from '../lib/geometry';
import { bendDelta, bowEndpoints, edgeMidpoint } from '../lib/edgeBend';

const DRAG_THRESHOLD = 4;

export function EdgeView({ edge, from, to, edgeMode, selected, defaultBend, onSelect }: {
  edge: Edge;
  from: GraphNode;
  to: GraphNode;
  edgeMode: EdgeMode;
  selected: boolean;
  defaultBend: number;
  onSelect: (edge: Edge, x: number, y: number) => void;
}) {
  const { dispatch } = useGraph();
  const bend = edge.bend ?? defaultBend;
  const anchors = edgeEndpoints(from, to);
  const { sx, sy, tx, ty } = insetEndpoints(anchors.sx, anchors.sy, anchors.tx, anchors.ty, !!edge.bidirectional);
  const bowed = bowEndpoints(sx, sy, tx, ty, bend);
  const d = edgePath(edgeMode, bowed.sx, bowed.sy, bowed.tx, bowed.ty, bend);
  const { x: mx, y: my } = edgeMidpoint(edgeMode, bowed.sx, bowed.sy, bowed.tx, bowed.ty, bend);

  const draggedRef = useRef(false);
  const startBendRef = useRef(bend);

  const dragBend = usePointerDrag({
    onStart: () => {
      draggedRef.current = false;
      startBendRef.current = bend;
    },
    onMove: (dx, dy) => {
      if (!draggedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      draggedRef.current = true;
      dispatch({ type: 'BEND_EDGE', id: edge.id, bend: startBendRef.current + bendDelta(sx, sy, tx, ty, dx, dy) });
    },
    onEnd: () => dispatch({ type: 'END_SESSION' }),
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    onSelect(edge, e.clientX, e.clientY);
  };

  return (
    <g>
      <path
        className="edge-hit"
        stroke="transparent"
        strokeWidth={14}
        fill="none"
        d={d}
        onMouseDown={dragBend}
        onClick={handleClick}
      />
      <path
        className="edge"
        markerEnd="url(#arrow)"
        markerStart={edge.bidirectional ? 'url(#arrow)' : undefined}
        stroke={selected ? '#4f8cff' : '#5b6b8c'}
        strokeWidth={2}
        fill="none"
        d={d}
        onMouseDown={dragBend}
        onClick={handleClick}
      />
      <text className="edge-label" textAnchor="middle" x={mx} y={my} onMouseDown={dragBend} onClick={handleClick}>
        {edge.label}
      </text>
    </g>
  );
}
