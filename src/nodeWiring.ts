import { nodes, canvas, svg } from './state';
import type { GraphNode } from './types';
import { createEdge, edgePath, updateEdges, portCenter } from './edges';
import { selectNode } from './nodes';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Attach drag-to-move, port-to-connect, and inline-rename behaviour. */
export function wireNode(node: GraphNode): void {
  const el = node.el;
  const box = el.querySelector('.box') as HTMLElement;
  const port = el.querySelector('[data-port]') as HTMLElement;
  const label = el.querySelector('.label') as HTMLElement;

  el.addEventListener('mousedown', () => selectNode(node.id));
  box.addEventListener('mousedown', (e) => startDrag(node, el, port, e));
  port.addEventListener('mousedown', (e) => startLink(node, el, e));

  label.addEventListener('dblclick', () => {
    label.contentEditable = 'true';
    label.focus();
    getSelection()?.selectAllChildren(label);
  });
  label.addEventListener('blur', () => {
    label.contentEditable = 'false';
    node.label = (label.textContent || '').trim() || node.label;
    label.textContent = node.label;
  });
  label.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); label.blur(); }
  });
}

function startDrag(node: GraphNode, el: HTMLElement, port: HTMLElement, e: MouseEvent): void {
  if (e.target === port) return;
  e.preventDefault();
  const sx = e.clientX, sy = e.clientY, ox = node.x, oy = node.y;
  el.classList.add('dragging');
  const move = (ev: MouseEvent) => {
    node.x = Math.max(0, ox + ev.clientX - sx);
    node.y = Math.max(0, oy + ev.clientY - sy);
    el.style.left = node.x + 'px';
    el.style.top = node.y + 'px';
    updateEdges();
  };
  const up = () => {
    el.classList.remove('dragging');
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}

function startLink(node: GraphNode, el: HTMLElement, e: MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();
  el.classList.add('link-source');
  const tmp = document.createElementNS(SVG_NS, 'path');
  tmp.setAttribute('stroke', '#34d399');
  tmp.setAttribute('stroke-width', '2');
  tmp.setAttribute('stroke-dasharray', '5 4');
  tmp.setAttribute('fill', 'none');
  svg.appendChild(tmp);
  const move = (ev: MouseEvent) => {
    const r = canvas.getBoundingClientRect();
    const s = portCenter(node);
    tmp.setAttribute('d', edgePath(s.x, s.y, ev.clientX - r.left, ev.clientY - r.top));
  };
  const up = (ev: MouseEvent) => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
    el.classList.remove('link-source');
    svg.removeChild(tmp);
    const hit = (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)?.closest('.node');
    if (hit) {
      const toId = Object.values(nodes).find((n) => n.el === hit)?.id;
      if (toId && toId !== node.id) createEdge(node.id, toId);
    }
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}
