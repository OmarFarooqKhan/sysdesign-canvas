import { toPng } from 'html-to-image';
import type { GraphState } from '../types';
import { contentBounds } from './viewport';

const PADDING = 40;

/** Rasterize the diagram (nodes/edges/regions), sized to its content, and download it as a PNG. */
export async function exportPng(
  state: GraphState,
  canvasEl: HTMLElement | null,
  filename = 'system-design.png',
): Promise<void> {
  const bounds = contentBounds(state);
  const inner = canvasEl?.querySelector<HTMLElement>('.canvas-inner');
  if (!bounds || !inner) return;

  const width = bounds.maxX - bounds.minX + PADDING * 2;
  const height = bounds.maxY - bounds.minY + PADDING * 2;
  const dataUrl = await toPng(inner, {
    width,
    height,
    backgroundColor: getComputedStyle(canvasEl!).backgroundColor,
    style: {
      transform: `translate(${PADDING - bounds.minX}px, ${PADDING - bounds.minY}px)`,
      transformOrigin: '0 0',
    },
  });

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
