import type { Tpl } from './types';

export const feed: Tpl = {
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
};
