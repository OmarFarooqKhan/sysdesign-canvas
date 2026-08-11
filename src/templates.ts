import { createNode, deleteNode } from './nodes';
import { createEdge } from './edges';
import { createRegion, deleteRegion } from './regions';
import { nodes, regions, ids } from './state';
import type { Region } from './types';

interface TplNode { key: string; icon: string; label: string; x: number; y: number; }
interface Tpl {
  nodes: TplNode[];
  edges: Array<[number, number, string]>;
  regions: Array<Partial<Region>>;
}

export const TEMPLATES: Record<string, Tpl> = {
  url: {
    nodes: [
      { key: 'browser', icon: 'browser', label: 'Client', x: 40, y: 200 },
      { key: 'lb', icon: 'lb', label: 'Load Balancer', x: 200, y: 200 },
      { key: 'server', icon: 'server', label: 'API Server', x: 370, y: 200 },
      { key: 'cache', icon: 'cache', label: 'Cache', x: 540, y: 90 },
      { key: 'sql', icon: 'sql', label: 'URL DB', x: 540, y: 300 },
      { key: 'blob', icon: 'blob', label: 'ID Generator', x: 370, y: 360 },
    ],
    edges: [[0, 1, 'HTTPS'], [1, 2, ''], [2, 3, 'read'], [2, 4, 'read/write'], [2, 5, 'gen id']],
    regions: [{ title: 'Backend', x: 340, y: 150, w: 400, h: 280, color: '#34d399' }],
  },
  chat: {
    nodes: [
      { key: 'mobile', icon: 'mobile', label: 'Mobile', x: 40, y: 230 },
      { key: 'gateway', icon: 'gateway', label: 'WS Gateway', x: 210, y: 230 },
      { key: 'micro', icon: 'micro', label: 'Chat Service', x: 380, y: 230 },
      { key: 'queue', icon: 'queue', label: 'Msg Queue', x: 380, y: 90 },
      { key: 'nosql', icon: 'nosql', label: 'Messages DB', x: 560, y: 230 },
      { key: 'worker', icon: 'worker', label: 'Push Worker', x: 560, y: 90 },
    ],
    edges: [[0, 1, 'WebSocket'], [1, 2, ''], [2, 3, 'publish'], [3, 5, 'consume'], [2, 4, 'store']],
    regions: [{ title: 'Realtime Backend', x: 350, y: 50, w: 400, h: 320, color: '#a78bfa' }],
  },
  feed: {
    nodes: [
      { key: 'browser', icon: 'browser', label: 'Client', x: 40, y: 220 },
      { key: 'cdn', icon: 'cdn', label: 'CDN', x: 200, y: 110 },
      { key: 'gateway', icon: 'gateway', label: 'API Gateway', x: 200, y: 300 },
      { key: 'micro', icon: 'micro', label: 'Feed Service', x: 380, y: 300 },
      { key: 'cache', icon: 'cache', label: 'Feed Cache', x: 560, y: 200 },
      { key: 'nosql', icon: 'nosql', label: 'Posts DB', x: 560, y: 380 },
      { key: 'stream', icon: 'stream', label: 'Fanout Stream', x: 380, y: 440 },
    ],
    edges: [[0, 1, 'assets'], [0, 2, 'API'], [2, 3, ''], [3, 4, 'read'], [3, 5, 'read'], [3, 6, 'fanout']],
    regions: [{ title: 'Feed Backend', x: 350, y: 160, w: 400, h: 340, color: '#38bdf8' }],
  },
};

/** Wipe the whole canvas and reset id counters. */
export function clearAll(): void {
  Object.keys(nodes).forEach(deleteNode);
  regions.slice().forEach(deleteRegion);
  ids.n = ids.e = ids.r = 0;
}

export function loadTemplate(key: string): void {
  const t = TEMPLATES[key];
  if (!t) return;
  clearAll();
  t.regions.forEach((r) => createRegion(r));
  const made = t.nodes.map((n) => createNode({ key: n.key, icon: n.icon, label: n.label }, n.x, n.y));
  t.edges.forEach(([a, b, l]) => createEdge(made[a].id, made[b].id, undefined, l));
}
