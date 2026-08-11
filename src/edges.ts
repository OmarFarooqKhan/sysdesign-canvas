import { edges, nodes, ids, ui, svg } from './state';
import type { Edge, GraphNode } from './types';
import { openMenu } from './contextmenu';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Anchor point on a node's right-hand connection port. */
export function portCenter(n: GraphNode) {
  return { x: n.x + 96 - 16, y: n.y + 32 };
}

/** Build the SVG path for the current edge mode. */
export function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  if (ui.edgeMode === 'ortho') {
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`;
  }
  const dx = Math.abs(x2 - x1) * 0.5 + 20;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export function createEdge(from: string, to: string, id?: string, lbl?: string): void {
  if (edges.some((e) => e.from === from && e.to === to)) return;
  const edgeId = id || 'e' + ++ids.e;
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('stroke', '#5b6b8c');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');
  path.setAttribute('marker-end', 'url(#arrow)');
  path.style.cursor = 'pointer';
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('class', 'edge-label');
  text.setAttribute('text-anchor', 'middle');
  text.textContent = lbl || '';
  svg.appendChild(path);
  svg.appendChild(text);
  const edge: Edge = { id: edgeId, from, to, label: lbl || '', el: path, textEl: text };
  edges.push(edge);
  path.addEventListener('click', (e) => { e.stopPropagation(); selectEdge(edge, e); });
  text.addEventListener('click', (e) => { e.stopPropagation(); renameEdge(edge); });
  updateEdges();
}

function selectEdge(edge: Edge, e: MouseEvent): void {
  edges.forEach((ed) => ed.el.setAttribute('stroke', '#5b6b8c'));
  edge.el.setAttribute('stroke', '#4f8cff');
  openMenu(e.clientX, e.clientY, [
    { label: '✎ Label edge', onClick: () => renameEdge(edge) },
    { label: '🗑 Delete edge', danger: true, onClick: () => deleteEdge(edge) },
  ]);
}

export function renameEdge(edge: Edge): void {
  const v = prompt('Edge label (e.g. "reads", "publishes", "gRPC"):', edge.label);
  if (v !== null) { edge.label = v.trim(); updateEdges(); }
}

/** Re-route every edge to its current endpoints. Call after any move. */
export function updateEdges(): void {
  edges.forEach((e) => {
    const a = nodes[e.from], b = nodes[e.to];
    if (!a || !b) return;
    const s = portCenter(a);
    const t = { x: b.x + 48, y: b.y + 32 };
    const tx = t.x + (s.x > t.x ? 48 : -48);
    e.el.setAttribute('d', edgePath(s.x, s.y, tx, t.y));
    e.textEl.setAttribute('x', String((s.x + tx) / 2));
    e.textEl.setAttribute('y', String((s.y + t.y) / 2 - 6));
    e.textEl.textContent = e.label;
  });
}

export function deleteEdge(edge: Edge): void {
  edge.el.remove();
  edge.textEl.remove();
  const i = edges.indexOf(edge);
  if (i >= 0) edges.splice(i, 1);
}
