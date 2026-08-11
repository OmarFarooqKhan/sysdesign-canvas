import { nodes, edges, regions, ui, ids } from './state';
import { createNode } from './nodes';
import { createEdge } from './edges';
import { createRegion } from './regions';
import { clearAll } from './templates';
import { updateEdgeStyleLabel } from './toolbar';
import type { GraphData } from './types';

const num = (id?: string) => parseInt(String(id).replace(/\D/g, '')) || 0;

/** Download the current diagram as a JSON file. */
export function exportGraph(): void {
  const data: GraphData = {
    edgeMode: ui.edgeMode,
    nodes: Object.values(nodes).map((n) => ({ id: n.id, key: n.key, icon: n.icon, label: n.label, x: n.x, y: n.y })),
    edges: edges.map((e) => ({ id: e.id, from: e.from, to: e.to, label: e.label })),
    regions: regions.map((r) => ({ id: r.id, title: r.title, x: r.x, y: r.y, w: r.w, h: r.h, color: r.color })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'system-design.json';
  a.click();
}

/** Replace the canvas with a diagram loaded from a JSON file. */
export function importGraph(file: File): void {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(reader.result as string) as GraphData;
      clearAll();
      ui.edgeMode = d.edgeMode === 'ortho' ? 'ortho' : 'curved';
      updateEdgeStyleLabel();
      (d.regions || []).forEach((rg) => { createRegion(rg); ids.r = Math.max(ids.r, num(rg.id)); });
      d.nodes.forEach((n) => {
        createNode({ key: n.key, icon: n.icon, label: n.label }, n.x, n.y, n.id, n.label);
        ids.n = Math.max(ids.n, num(n.id));
      });
      (d.edges || []).forEach((ed) => { createEdge(ed.from, ed.to, ed.id, ed.label); ids.e = Math.max(ids.e, num(ed.id)); });
    } catch (err) {
      alert('Could not import: ' + (err as Error).message);
    }
  };
  reader.readAsText(file);
}
