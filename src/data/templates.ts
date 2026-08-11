import type { GraphData, GraphNode, Region } from '../types';

interface TplNode { key: string; icon: string; label: string; x: number; y: number; }
interface Tpl {
  nodes: TplNode[];
  edges: Array<[number, number, string]>;
  regions: Array<Partial<Region>>;
}

export type TemplateKey = 'url' | 'chat' | 'feed';

export const TEMPLATE_OPTIONS: Array<{ key: TemplateKey; label: string }> = [
  { key: 'url', label: 'URL Shortener' },
  { key: 'chat', label: 'Chat App' },
  { key: 'feed', label: 'News Feed' },
];

const TEMPLATES: Record<TemplateKey, Tpl> = {
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

/** Expand a template into a full GraphData with generated ids. */
export function templateToData(key: TemplateKey): GraphData {
  const t = TEMPLATES[key];
  const nodes: GraphNode[] = t.nodes.map((n, i) => ({ id: `n${i + 1}`, ...n }));
  const edges = t.edges.map(([a, b, label], i) => ({ id: `e${i + 1}`, from: nodes[a].id, to: nodes[b].id, label }));
  const regions: Region[] = t.regions.map((r, i) => ({
    id: `r${i + 1}`, title: r.title ?? 'Region', x: r.x ?? 80, y: r.y ?? 80,
    w: r.w ?? 260, h: r.h ?? 180, color: r.color ?? '#4f8cff',
  }));
  return { nodes, edges, regions };
}
