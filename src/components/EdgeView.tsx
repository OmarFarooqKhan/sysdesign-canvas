import type { Edge, EdgeMode, GraphNode } from '../types';
import { edgeEndpoints, edgePath } from '../lib/geometry';

export function EdgeView({ edge, from, to, edgeMode, selected, onSelect }: {
  edge: Edge;
  from: GraphNode;
  to: GraphNode;
  edgeMode: EdgeMode;
  selected: boolean;
  onSelect: (edge: Edge, x: number, y: number) => void;
}) {
  const { sx, sy, tx, ty } = edgeEndpoints(from, to);
  const d = edgePath(edgeMode, sx, sy, tx, ty);
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(edge, e.clientX, e.clientY);
  };

  return (
    <g>
      <path
        className="edge"
        markerEnd="url(#arrow)"
        markerStart={edge.bidirectional ? 'url(#arrow)' : undefined}
        stroke={selected ? '#4f8cff' : '#5b6b8c'}
        strokeWidth={2}
        fill="none"
        d={d}
        onClick={handleClick}
      />
      <text className="edge-label" textAnchor="middle" x={mx} y={my} onClick={handleClick}>
        {edge.label}
      </text>
    </g>
  );
}
