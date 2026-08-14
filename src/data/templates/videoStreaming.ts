import type { Tpl } from './types';

export const videoStreaming: Tpl = {
  nodes: [
    { key: 'browser', icon: 'browser', label: 'Client', x: 40, y: 220 },
    { key: 'cdn', icon: 'cdn', label: 'CDN', x: 210, y: 90 },
    { key: 'gateway', icon: 'gateway', label: 'API Gateway', x: 210, y: 320 },
    { key: 'micro', icon: 'micro', label: 'Video Service', x: 390, y: 320 },
    { key: 'worker', icon: 'worker', label: 'Transcoder', x: 390, y: 150 },
    { key: 'blob', icon: 'blob', label: 'Video Storage', x: 570, y: 230 },
    { key: 'nosql', icon: 'nosql', label: 'Metadata DB', x: 570, y: 400 },
  ],
  edges: [
    [0, 1, 'stream'], [0, 2, 'upload/API'], [2, 3, ''], [3, 4, 'transcode job'],
    [4, 5, 'store encoded'], [3, 6, 'read/write'], [1, 5, 'origin fetch'],
  ],
  regions: [{ title: 'Video Backend', x: 360, y: 70, w: 400, h: 380, color: '#a78bfa' }],
};
