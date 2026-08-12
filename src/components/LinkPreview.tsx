/**
 * Preview arrow shown while dragging from a node's port to form a new edge.
 * Coordinates are canvas-space, relative to the owning node's own x/y — the SVG sits at
 * that node's local origin (overflow visible) so it scales/pans with the rest of the
 * canvas via the same ancestor transform, instead of being a viewport-fixed overlay.
 */
export function LinkPreview({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 50 }}>
      <defs>
        <marker id="temp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#34d399" />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#34d399" strokeWidth={2} markerEnd="url(#temp-arrow)" />
    </svg>
  );
}
