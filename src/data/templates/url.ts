import type { Tpl } from './types';

export const url: Tpl = {
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
};
