import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Edge } from '../types';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { useViewport } from '../store/ViewportContext';
import { EdgeView } from './EdgeView';
import { ContextMenu } from './ContextMenu';
import { autoBend } from '../lib/reciprocalBend';

export function EdgeLayer() {
  const { state, dispatch } = useGraph();
  const { edgeMode, selectedEdgeId, selectEdge } = useUI();
  const { canvasRef } = useViewport();
  const [menu, setMenu] = useState<{ edge: Edge; x: number; y: number } | null>(null);

  // Position relative to the (unscaled) canvas root, not the zoomed .canvas-inner layer the
  // edge itself lives in, so the menu is portaled there too and never inherits the zoom scale.
  const onSelectEdge = (edge: Edge, x: number, y: number) => {
    selectEdge(edge.id);
    const rect = canvasRef.current!.getBoundingClientRect();
    setMenu({ edge, x: x - rect.left, y: y - rect.top });
  };

  // The menu's edge can be deleted out from under it (e.g. the Delete key,
  // which bypasses the menu's own onClose) — drop the menu once that happens.
  useEffect(() => {
    if (menu && !state.edges.some((e) => e.id === menu.edge.id)) setMenu(null);
  }, [menu, state.edges]);

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
      <svg className="edges">
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
                defaultBend={autoBend(state.edges, e, state.nodes[e.from], state.nodes[e.to])}
                onSelect={onSelectEdge}
              />
            ),
        )}
      </svg>
      {menu && canvasRef.current && createPortal(
        <ContextMenu x={menu.x} y={menu.y} items={items} onClose={() => setMenu(null)} />,
        canvasRef.current,
      )}
    </>
  );
}
