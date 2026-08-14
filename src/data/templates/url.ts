import type { Tpl } from './types';

export const url: Tpl = {
  nodes: [
    { key: 'browser', icon: 'browser', label: 'Client', x: 40, y: 240 },
    { key: 'lb', icon: 'lb', label: 'Load Balancer', x: 206, y: 240 },
    { key: 'server', icon: 'server', label: 'API Server', x: 372, y: 240 },
    { key: 'cache', icon: 'cache', label: 'Cache', x: 538, y: 106 },
    { key: 'sql', icon: 'sql', label: 'URL DB', x: 538, y: 374 },
    { key: 'blob', icon: 'blob', label: 'ID Generator', x: 372, y: 374 },
  ],
  edges: [
    [0, 1, 'HTTPS'], [1, 2, ''], [2, 3, 'read'], [2, 4, 'read/write'], [2, 5, 'gen id'],
    [5, 4, 'persist mapping'], [4, 3, 'warm cache'],
  ],
  regions: [{ title: 'Backend', x: 170, y: 70, w: 500, h: 404, color: '#34d399' }],
  walkthrough: [
    [0, 'The client sends the long URL it wants shortened (or a short code to resolve) over HTTPS.'],
    [1, 'The load balancer terminates TLS and spreads requests across a pool of stateless API servers so no single instance is a bottleneck.'],
    [2, 'The API server validates the submitted URL and, for a create request, needs a unique short code before it can write anything durable.'],
    [5, 'A dedicated ID Generator produces a unique short code — e.g. a base62-encoded counter or Snowflake-style ID — so two concurrent create requests never collide on the same slug.'],
    [4, 'The URL DB persists the new {shortCode → longURL} mapping as the durable source of truth, keyed by the code the generator just produced.'],
    [3, 'The fresh mapping is written through into the Cache immediately, so the very next redirect for this code is served from memory instead of round-tripping to the DB.'],
  ],
};
