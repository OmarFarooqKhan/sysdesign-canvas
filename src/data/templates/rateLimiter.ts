import type { Tpl } from './types';

export const rateLimiter: Tpl = {
  nodes: [
    { key: 'browser', icon: 'browser', label: 'Client', x: 40, y: 220 },
    { key: 'gateway', icon: 'gateway', label: 'API Gateway', x: 200, y: 220 },
    { key: 'micro', icon: 'micro', label: 'Rate Limiter', x: 370, y: 220 },
    { key: 'cache', icon: 'cache', label: 'Counter Cache', x: 370, y: 90 },
    { key: 'config', icon: 'config', label: 'Rule Config', x: 370, y: 360 },
    { key: 'server', icon: 'server', label: 'App Server', x: 540, y: 220 },
    { key: 'monitor', icon: 'monitor', label: 'Monitoring', x: 540, y: 90 },
  ],
  edges: [
    [0, 1, 'request'], [1, 2, 'check limit'], [2, 3, 'incr/check count'],
    [2, 4, 'load rules'], [2, 5, 'forward if allowed'], [2, 6, 'emit metrics'],
  ],
  regions: [{ title: 'Rate Limiting Layer', x: 340, y: 50, w: 400, h: 340, color: '#fbbf24' }],
};
