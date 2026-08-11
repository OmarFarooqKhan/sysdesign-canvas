import { regions, ids, ui, canvas, refreshEmpty } from './state';
import type { Region } from './types';
import { selectNode } from './nodes';
import { wireRegion } from './regionWiring';

const REGION_COLORS = ['#4f8cff', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8'];

export function createRegion(opts: Partial<Region> = {}): Region {
  const id = opts.id || 'r' + ++ids.r;
  const el = document.createElement('div');
  el.className = 'region';
  const color = opts.color || REGION_COLORS[regions.length % REGION_COLORS.length];
  el.style.setProperty('--reg', color);
  const x = opts.x ?? 80, y = opts.y ?? 80, w = opts.w ?? 260, h = opts.h ?? 180;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  el.innerHTML = `
    <div class="r-title" contenteditable="false">${opts.title || 'Region'}</div>
    <div class="r-del" title="Delete region">✕</div>
    <div class="r-resize"></div>`;
  canvas.appendChild(el);
  const reg: Region = { id, title: opts.title || 'Region', x, y, w, h, color, el };
  regions.push(reg);
  wireRegion(reg);
  refreshEmpty();
  return reg;
}

export function selectRegion(id: string): void {
  regions.forEach((r) => r.el.classList.toggle('selected', r.id === id));
  ui.selectedRegion = id;
  selectNode(null);
}

export function deleteRegion(reg: Region): void {
  reg.el.remove();
  const i = regions.indexOf(reg);
  if (i >= 0) regions.splice(i, 1);
  if (ui.selectedRegion === reg.id) ui.selectedRegion = null;
  refreshEmpty();
}
