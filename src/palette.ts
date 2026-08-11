import { ICONS } from './icons';
import { canvas } from './state';
import { createNode } from './nodes';
import type { NodeDef } from './types';

interface PaletteSection {
  group: string;
  items: NodeDef[];
}

export const PALETTE: PaletteSection[] = [
  { group: 'Clients', items: [
    { key: 'browser', label: 'Web Client', icon: 'browser' },
    { key: 'mobile', label: 'Mobile App', icon: 'mobile' },
    { key: 'client', label: 'Desktop', icon: 'client' },
    { key: 'external', label: '3rd-party API', icon: 'external' },
  ] },
  { group: 'Edge / Routing', items: [
    { key: 'dns', label: 'DNS', icon: 'dns' },
    { key: 'cdn', label: 'CDN', icon: 'cdn' },
    { key: 'lb', label: 'Load Balancer', icon: 'lb' },
    { key: 'gateway', label: 'API Gateway', icon: 'gateway' },
    { key: 'auth', label: 'Auth Service', icon: 'auth' },
  ] },
  { group: 'Compute', items: [
    { key: 'server', label: 'App Server', icon: 'server' },
    { key: 'micro', label: 'Microservice', icon: 'micro' },
    { key: 'worker', label: 'Worker', icon: 'worker' },
    { key: 'scheduler', label: 'Scheduler', icon: 'scheduler' },
  ] },
  { group: 'Data', items: [
    { key: 'sql', label: 'SQL DB', icon: 'sql' },
    { key: 'nosql', label: 'NoSQL DB', icon: 'nosql' },
    { key: 'cache', label: 'Cache', icon: 'cache' },
    { key: 'blob', label: 'Object Store', icon: 'blob' },
    { key: 'search', label: 'Search Index', icon: 'search' },
  ] },
  { group: 'Async / Ops', items: [
    { key: 'queue', label: 'Message Queue', icon: 'queue' },
    { key: 'stream', label: 'Event Stream', icon: 'stream' },
    { key: 'config', label: 'Config / Registry', icon: 'config' },
    { key: 'monitor', label: 'Monitoring', icon: 'monitor' },
  ] },
];

export function buildPalette(): void {
  const paletteEl = document.getElementById('palette')!;
  PALETTE.forEach((sec) => {
    const h = document.createElement('h2');
    h.textContent = sec.group;
    paletteEl.appendChild(h);
    sec.items.forEach((it) => {
      const d = document.createElement('div');
      d.className = 'pal-item';
      d.draggable = true;
      d.innerHTML = `<span class="ico">${ICONS[it.icon]}</span><span>${it.label}</span>`;
      d.addEventListener('dragstart', (e) => e.dataTransfer!.setData('text/plain', JSON.stringify(it)));
      paletteEl.appendChild(d);
    });
  });
}

export function initDrop(): void {
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    let data: NodeDef;
    try { data = JSON.parse(e.dataTransfer!.getData('text/plain')); } catch { return; }
    const r = canvas.getBoundingClientRect();
    createNode(data, e.clientX - r.left - 48, e.clientY - r.top - 32);
  });
}
