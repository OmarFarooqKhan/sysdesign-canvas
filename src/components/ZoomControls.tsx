import { useViewport } from '../store/ViewportContext';
import { ZOOM_MAX, ZOOM_MIN } from '../lib/viewport';

/** Floating zoom cluster, bottom-right of the canvas: translucent at rest, opaque on hover. */
export function ZoomControls() {
  const { zoom, zoomIn, zoomOut } = useViewport();
  return (
    <div className="zoom-controls">
      <button onClick={zoomOut} disabled={zoom <= ZOOM_MIN} aria-label="Zoom out">−</button>
      <span className="zoom-pct">{Math.round(zoom * 100)}%</span>
      <button onClick={zoomIn} disabled={zoom >= ZOOM_MAX} aria-label="Zoom in">+</button>
    </div>
  );
}
