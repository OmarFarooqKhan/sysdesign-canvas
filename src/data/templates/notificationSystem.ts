import type { Tpl } from './types';

export const notifications: Tpl = {
  nodes: [
    { key: 'mobile', icon: 'mobile', label: 'Client App', x: 40, y: 230 },
    { key: 'gateway', icon: 'gateway', label: 'API Gateway', x: 210, y: 230 },
    { key: 'micro', icon: 'micro', label: 'Notification Service', x: 390, y: 230 },
    { key: 'config', icon: 'config', label: 'Template Store', x: 390, y: 90 },
    { key: 'nosql', icon: 'nosql', label: 'Preferences DB', x: 390, y: 380 },
    { key: 'queue', icon: 'queue', label: 'Notification Queue', x: 570, y: 150 },
    { key: 'worker', icon: 'worker', label: 'Push Worker', x: 570, y: 320 },
  ],
  edges: [
    [0, 1, 'send request'], [1, 2, ''], [2, 3, 'load template'],
    [2, 4, 'check prefs'], [2, 5, 'enqueue'], [5, 6, 'consume'], [6, 0, 'push notification'],
  ],
  regions: [{ title: 'Notification Backend', x: 360, y: 60, w: 400, h: 340, color: '#f87171' }],
};
