import { useRef, useState } from 'react';
import type { Edge } from '../types';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { EdgeView } from './EdgeView';
import { ContextMenu } from './ContextMenu';

export function EdgeLayer() {
  const { state, dispatch } = useGraph();
  const { edgeMode, selectedEdgeId, selectEdge } = useUI();
  const [menu, setMenu] = useState<{ edge: Edge; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const onSelectEdge = (edge: Edge, x: number, y: number) => {
    selectEdge(edge.id);
    const rect = svgRef.current!.getBoundingClientRect();
    setMenu({ edge, x: x - rect.left, y: y - rect.top });
  };

  const items = menu
    ? [
        {
          label: '✎ Label edge',
          onClick: () => {
            const v = window.prompt('Edge label:', menu.edge.label);
            if (v !== null) dispatch({ type: 'LABEL_EDGE', id: menu.edge.id, label: v.trim() });
          },
        },
        {
          label: menu.edge.bidirectional ? '→ One-way' : '↔ Bidirectional',
          onClick: () => dispatch({ type: 'TOGGLE_EDGE_DIRECTION', id: menu.edge.id }),
        },
        {
          label: '🗑 Delete edge',
          danger: true,
          onClick: () => dispatch({ type: 'DELETE_EDGE', id: menu.edge.id }),
        },
      ]
    : [];

  return (
    <>
      <svg className="edges" ref={svgRef}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#5b6b8c" />
          </marker>
        </defs>
        {state.edges.map(
          (e) =>
            state.nodes[e.from] &&
            state.nodes[e.to] && (
              <EdgeView
                key={e.id}
                edge={e}
                from={state.nodes[e.from]}
                to={state.nodes[e.to]}
                edgeMode={edgeMode}
                selected={selectedEdgeId === e.id}
                onSelect={onSelectEdge}
              />
            ),
        )}
      </svg>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={items} onClose={() => setMenu(null)} />}
    </>
  );
}
