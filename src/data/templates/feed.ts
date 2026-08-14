import type { Tpl } from './types';

export const feed: Tpl = {
  nodes: [
    { key: 'browser', icon: 'browser', label: 'Client', x: 40, y: 240 },
    { key: 'cdn', icon: 'cdn', label: 'CDN', x: 206, y: 106 },
    { key: 'gateway', icon: 'gateway', label: 'API Gateway', x: 206, y: 374 },
    { key: 'micro', icon: 'micro', label: 'Feed Service', x: 372, y: 374 },
    { key: 'cache', icon: 'cache', label: 'Feed Cache', x: 538, y: 106 },
    { key: 'nosql', icon: 'nosql', label: 'Posts DB', x: 538, y: 374 },
    { key: 'stream', icon: 'stream', label: 'Fanout Stream', x: 372, y: 508 },
  ],
  edges: [
    [0, 1, 'assets'], [0, 2, 'API'], [2, 3, ''], [3, 4, 'read'], [3, 5, 'read'], [3, 6, 'fanout'],
    [4, 5, 'cache miss'],
  ],
  regions: [{ title: 'Feed Backend', x: 336, y: 70, w: 334, h: 538, color: '#38bdf8' }],
  walkthrough: [
    [1, "The client's static assets — JS bundles, images, avatars — are served from the CDN's edge cache, keeping them off the origin entirely."],
    [0, 'In parallel, the browser calls the API Gateway to fetch the personalized feed payload — the CDN only ever serves static assets, never per-user data.'],
    [2, 'The API Gateway authenticates the request and routes it to the Feed Service, keeping client-facing routing separate from feed-ranking logic.'],
    [3, "The Feed Service assembles the user's home timeline; the same service also fans new posts out to followers' cached timelines whenever this user publishes."],
    [4, 'The service first checks the Feed Cache for a precomputed timeline (the result of that fan-out-on-write), so most reads never touch the database at all.'],
    [5, 'On a cache miss — a new or inactive user with no precomputed timeline yet — the request falls through to the Posts DB, and the rebuilt timeline gets written back into the cache for next time.'],
  ],
};
