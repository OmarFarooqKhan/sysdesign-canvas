import type { GraphState } from '../types';
import { NODE_H, NODE_W } from './geometry';

export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 0.25;

/** Clamp a zoom factor to the supported range. */
export function clampZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

/** Step zoom up (dir > 0) or down (dir <= 0) by one fixed increment, clamped. */
export function stepZoom(zoom: number, dir: number): number {
  const stepped = zoom + (dir > 0 ? ZOOM_STEP : -ZOOM_STEP);
  return clampZoom(Math.round(stepped * 100) / 100);
}

export interface Viewport { zoom: number; panX: number; panY: number; }

/** Convert a client (screen) point to canvas-space coordinates given the canvas's rect. */
export function screenToCanvas(clientX: number, clientY: number, rect: DOMRect, vp: Viewport) {
  return { x: (clientX - rect.left - vp.panX) / vp.zoom, y: (clientY - rect.top - vp.panY) / vp.zoom };
}

/**
 * Convert a client point to canvas coordinates local to (originX, originY) — e.g. a node's
 * own x/y — so callers can position elements relative to it without depending on `rect`
 * being defined. Falls back to a raw (unscaled) delta when `rect` isn't available yet.
 */
export function screenToLocal(
  clientX: number, clientY: number, rect: DOMRect | undefined, vp: Viewport, originX: number, originY: number,
) {
  if (!rect) return { x: clientX - originX, y: clientY - originY };
  const p = screenToCanvas(clientX, clientY, rect, vp);
  return { x: p.x - originX, y: p.y - originY };
}

export interface Bounds { minX: number; minY: number; maxX: number; maxY: number; }

/** Bounding box of all nodes + regions, or null when the canvas is empty. */
export function contentBounds(state: GraphState): Bounds | null {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const n of Object.values(state.nodes)) { xs.push(n.x, n.x + NODE_W); ys.push(n.y, n.y + NODE_H); }
  for (const r of state.regions) { xs.push(r.x, r.x + r.w); ys.push(r.y, r.y + r.h); }
  if (xs.length === 0) return null;
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

const FIT_PADDING = 40;

/** Zoom/pan that fits `bounds` inside a viewport of the given pixel size, with padding. */
export function fitTransform(bounds: Bounds, viewportW: number, viewportH: number): Viewport {
  const w = Math.max(1, bounds.maxX - bounds.minX);
  const h = Math.max(1, bounds.maxY - bounds.minY);
  const zoom = clampZoom(Math.min((viewportW - FIT_PADDING * 2) / w, (viewportH - FIT_PADDING * 2) / h));
  return {
    zoom,
    panX: (viewportW - w * zoom) / 2 - bounds.minX * zoom,
    panY: (viewportH - h * zoom) / 2 - bounds.minY * zoom,
  };
}
