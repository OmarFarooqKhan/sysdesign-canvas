import type { Tpl } from './types';

export const chat: Tpl = {
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
};
