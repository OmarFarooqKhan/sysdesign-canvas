export interface GuideLines {
  vertical: number[];
  horizontal: number[];
}

/** Guides span this far past the origin in either direction so they read as full-length lines
 *  regardless of pan/zoom, without needing to know the viewport size. */
const SPAN = 4000;

/** Alignment-guide lines for an in-progress node drag. Rendered as a direct sibling of the
 *  dragging node inside `.canvas-inner` (see NodeView) so it pans/zooms with the content;
 *  the caller clears `guides` on drag end. */
export function Guides({ guides }: { guides: GuideLines | null }) {
  if (!guides) return null;
  return (
    <>
      {guides.vertical.map((x) => (
        <div key={`v${x}`} className="guide guide-v" style={{ left: x, top: -SPAN, height: SPAN * 2 }} />
      ))}
      {guides.horizontal.map((y) => (
        <div key={`h${y}`} className="guide guide-h" style={{ top: y, left: -SPAN, width: SPAN * 2 }} />
      ))}
    </>
  );
}
