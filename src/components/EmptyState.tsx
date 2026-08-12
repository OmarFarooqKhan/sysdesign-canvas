import { useGraph } from '../store/GraphContext';

export function EmptyState() {
  const { state } = useGraph();
  if (Object.keys(state.nodes).length !== 0 || state.regions.length !== 0) return null;
  return (
    <div className="empty-state">
      <div className="big">🖱️</div>
      Drag a component from the left onto the canvas
      <br />
      to start designing your system
    </div>
  );
}
