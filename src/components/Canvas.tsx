import type { DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { NodeDef } from '../types';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { useKeyboard } from '../hooks/useKeyboard';
import { EdgeLayer } from './EdgeLayer';
import { NodeView } from './NodeView';
import { RegionView } from './RegionView';
import { EmptyState } from './EmptyState';

/** The diagram surface: drop target for new nodes, hosts edges/regions/nodes. */
export function Canvas() {
  const { state, dispatch } = useGraph();
  const { clearSelection } = useUI();
  useKeyboard();

  const onDrop = (e: ReactDragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    const def = JSON.parse(raw) as NodeDef;
    const r = e.currentTarget.getBoundingClientRect();
    dispatch({ type: 'ADD_NODE', def, x: e.clientX - r.left - 48, y: e.clientY - r.top - 32 });
  };

  const onMouseDown = (e: ReactMouseEvent) => {
    if (e.target === e.currentTarget) clearSelection();
  };

  return (
    <div
      className="canvas"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onMouseDown={onMouseDown}
    >
      <EdgeLayer />
      {state.regions.map((r) => <RegionView key={r.id} region={r} />)}
      {Object.values(state.nodes).map((n) => <NodeView key={n.id} node={n} />)}
      <EmptyState />
    </div>
  );
}
