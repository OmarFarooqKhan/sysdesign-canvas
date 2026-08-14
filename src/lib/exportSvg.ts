import type { EdgeMode, GraphState } from '../types';
import { contentBounds } from './viewport';
import { autoBend } from './reciprocalBend';
import { downloadBlob } from './dom';
import { svgEdge, svgNode, svgRegion } from './svgParts';

const PADDING = 40;
const BG = '#0f1420';
/** Copied from EdgeLayer.tsx's <defs> so the export renders identical arrowheads standalone. */
const ARROW_MARKER =
  '<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" ' +
  'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#5b6b8c" /></marker>';

/** Build a self-contained SVG document string of the diagram, from state (not the DOM) — every
 *  ingredient is one of this codebase's existing pure geometry/render helpers. A dark background
 *  rect matches the app theme so the file stands alone. Empty canvas (no content bounds) is a
 *  no-op, returning ''. */
export function buildSvg(state: GraphState, edgeMode: EdgeMode): string {
  const bounds = contentBounds(state);
  if (!bounds) return '';
  const x = bounds.minX - PADDING;
  const y = bounds.minY - PADDING;
  const w = bounds.maxX - bounds.minX + PADDING * 2;
  const h = bounds.maxY - bounds.minY + PADDING * 2;

  const regions = state.regions.map(svgRegion).join('');
  const edges = state.edges
    .filter((e) => state.nodes[e.from] && state.nodes[e.to])
    .map((e) => {
      const from = state.nodes[e.from];
      const to = state.nodes[e.to];
      return svgEdge(e, from, to, edgeMode, autoBend(state.edges, e, from, to));
    })
    .join('');
  const nodes = Object.values(state.nodes).map(svgNode).join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">` +
    `<defs>${ARROW_MARKER}</defs>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${BG}" />` +
    regions + edges + nodes +
    '</svg>'
  );
}

/** Build + trigger a browser download of the diagram as a standalone .svg file. No-op on an
 *  empty canvas, mirroring exportPng's behavior. */
export function downloadSvg(state: GraphState, edgeMode: EdgeMode, filename = 'system-design.svg'): void {
  const svg = buildSvg(state, edgeMode);
  if (!svg) return;
  downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), filename);
}
