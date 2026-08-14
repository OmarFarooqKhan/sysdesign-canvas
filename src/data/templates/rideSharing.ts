import type { Tpl } from './types';

export const rideSharing: Tpl = {
  nodes: [
    { key: 'mobile', icon: 'mobile', label: 'Rider App', x: 40, y: 180 },
    { key: 'mobile', icon: 'mobile', label: 'Driver App', x: 40, y: 360 },
    { key: 'gateway', icon: 'gateway', label: 'API Gateway', x: 220, y: 270 },
    { key: 'micro', icon: 'micro', label: 'Matching Service', x: 390, y: 270 },
    { key: 'cache', icon: 'cache', label: 'Driver Location Cache', x: 560, y: 150 },
    { key: 'sql', icon: 'sql', label: 'Trips DB', x: 560, y: 390 },
    { key: 'worker', icon: 'worker', label: 'Pricing Worker', x: 390, y: 110 },
  ],
  edges: [
    [0, 2, 'request ride'], [1, 2, 'location ping'], [2, 3, 'match'],
    [3, 4, 'nearby drivers'], [3, 5, 'create trip'], [3, 6, 'estimate fare'],
  ],
  regions: [{ title: 'Matching Backend', x: 360, y: 60, w: 400, h: 340, color: '#4f8cff' }],
};
