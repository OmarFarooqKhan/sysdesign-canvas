import type { Edge, EdgeMode, GraphNode, Region } from '../types';
import { ICONS } from '../data/icons';
import { NODE_H, NODE_W, edgeEndpoints, insetEndpoints } from './geometry';
import { bowEndpoints, edgeMidpoint } from './edgeBend';
import { edgePath } from './edgePath';

const NODE_FILL = '#1e2536';
const NODE_STROKE = '#2a3349';
const TEXT = '#e6ebf5';
const MUTED = '#8b97b0';
const EDGE_STROKE = '#5b6b8c';
const ICON_SIZE = 34;

/** Escape text for safe embedding inside SVG markup, whether in an attribute or as content. */
export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Nest an icon's own inline <svg> markup (see data/icons.ts) at a fixed position/size, using
 *  the nested-<svg> element's native x/y/width/height support as its own mini viewport. */
function embedIcon(icon: string, x: number, y: number, size: number): string {
  const markup = ICONS[icon];
  if (!markup) return '';
  return markup.replace('<svg ', `<svg x="${x}" y="${y}" width="${size}" height="${size}" `);
}

/** A node's rounded rect (at its exact NODE_W x NODE_H coordinates) + its icon + label. */
export function svgNode(n: GraphNode): string {
  const iconX = n.x + (NODE_W - ICON_SIZE) / 2;
  const iconY = n.y + (NODE_H - ICON_SIZE) / 2;
  const labelX = n.x + NODE_W / 2;
  const labelY = n.y + NODE_H + 16;
  return (
    `<rect x="${n.x}" y="${n.y}" width="${NODE_W}" height="${NODE_H}" rx="14" fill="${NODE_FILL}" stroke="${NODE_STROKE}" stroke-width="1.5" />` +
    embedIcon(n.icon, iconX, iconY, ICON_SIZE) +
    `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="11.5" fill="${TEXT}">${escapeXml(n.label)}</text>`
  );
}

/** A region's dashed rounded rect + its title, positioned like RegionView's CSS box/title. */
export function svgRegion(r: Region): string {
  const color = escapeXml(r.color);
  return (
    `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="12" fill="${color}" fill-opacity="0.08" stroke="${color}" stroke-dasharray="5,4" />` +
    `<text x="${r.x + 12}" y="${r.y - 8}" font-size="11.5" fill="${color}">${escapeXml(r.title)}</text>`
  );
}

/** An edge's path (curved/ortho per `edgeMode`, bowed by its bend) + arrowhead marker(s) +
 *  label, built from the same pure geometry helpers EdgeView.tsx renders from. */
export function svgEdge(
  edge: Edge, from: GraphNode, to: GraphNode, edgeMode: EdgeMode, defaultBend: number,
): string {
  const bend = edge.bend ?? defaultBend;
  const a = edgeEndpoints(from, to);
  const { sx, sy, tx, ty } = insetEndpoints(a.sx, a.sy, a.tx, a.ty, !!edge.bidirectional);
  const bowed = bowEndpoints(sx, sy, tx, ty, bend);
  const d = edgePath(edgeMode, bowed.sx, bowed.sy, bowed.tx, bowed.ty, bend);
  const mid = edgeMidpoint(edgeMode, bowed.sx, bowed.sy, bowed.tx, bowed.ty, bend);
  const markerStart = edge.bidirectional ? ' marker-start="url(#arrow)"' : '';
  const label = edge.label
    ? `<text x="${mid.x}" y="${mid.y}" text-anchor="middle" font-size="11" fill="${MUTED}">${escapeXml(edge.label)}</text>`
    : '';
  return `<path d="${d}" stroke="${EDGE_STROKE}" stroke-width="2" fill="none" marker-end="url(#arrow)"${markerStart} />${label}`;
}
