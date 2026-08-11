import { nodes, edges, ids, regions, ui, canvas, refreshEmpty } from './state';
import { ICONS } from './icons';
import type { NodeDef, GraphNode } from './types';
import { deleteEdge } from './edges';
import { wireNode } from './nodeWiring';

export function createNode(def: NodeDef, x: number, y: number, id?: string, label?: string): GraphNode {
  const nodeId = id || 'n' + ++ids.n;
  const el = document.createElement('div');
  el.className = 'node';
  el.style.left = Math.max(0, x) + 'px';
  el.style.top = Math.max(0, y) + 'px';
  el.innerHTML = `
    <div class="box">${ICONS[def.icon]}<div class="port" data-port></div></div>
    <div class="label" contenteditable="false">${label || def.label}</div>`;
  canvas.appendChild(el);
  const node: GraphNode = {
    id: nodeId, key: def.key, icon: def.icon,
    label: label || def.label, x: Math.max(0, x), y: Math.max(0, y), el,
  };
  nodes[nodeId] = node;
  wireNode(node);
  refreshEmpty();
  return node;
}

/** Highlight one node (or clear with null); clears any region selection. */
export function selectNode(id: string | null): void {
  if (ui.selected && nodes[ui.selected]) nodes[ui.selected].el.classList.remove('selected');
  ui.selected = id;
  if (id && nodes[id]) {
    nodes[id].el.classList.add('selected');
    regions.forEach((r) => r.el.classList.remove('selected'));
    ui.selectedRegion = null;
  }
}

export function deleteNode(id: string): void {
  const n = nodes[id];
  if (!n) return;
  edges.filter((e) => e.from === id || e.to === id).forEach(deleteEdge);
  n.el.remove();
  delete nodes[id];
  if (ui.selected === id) ui.selected = null;
  refreshEmpty();
}
