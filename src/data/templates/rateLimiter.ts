import type { Tpl } from './types';

export const rateLimiter: Tpl = {
  nodes: [
    { key: 'browser', icon: 'browser', label: 'Client', x: 40, y: 240 },
    { key: 'gateway', icon: 'gateway', label: 'API Gateway', x: 206, y: 240 },
    { key: 'micro', icon: 'micro', label: 'Rate Limiter', x: 372, y: 240 },
    { key: 'cache', icon: 'cache', label: 'Counter Cache', x: 538, y: 106 },
    { key: 'config', icon: 'config', label: 'Rule Config', x: 372, y: 106 },
    { key: 'server', icon: 'server', label: 'App Server', x: 538, y: 240 },
    { key: 'monitor', icon: 'monitor', label: 'Monitoring', x: 372, y: 374 },
  ],
  edges: [
    [0, 1, 'request'], [1, 2, 'check limit'], [2, 3, 'incr/check count'],
    [2, 4, 'load rules'], [2, 5, 'forward if allowed'], [2, 6, 'emit metrics'],
    [4, 3, 'apply rule to count'], [3, 5, 'within limit'],
  ],
  regions: [{ title: 'Rate Limiting Layer', x: 336, y: 70, w: 334, h: 404, color: '#fbbf24' }],
  walkthrough: [
    [0, "The client fires an API request that must clear the rate limit before it's allowed to reach application logic."],
    [1, 'The API Gateway is the single entry point for all traffic and forwards every request to the Rate Limiter for evaluation before any business logic runs.'],
    [2, 'The Rate Limiter first looks up which policy applies to this caller from Rule Config — different endpoints or API tiers often carry different thresholds.'],
    [4, 'Rule Config defines the actual threshold, e.g. 100 requests/minute per API key, or a stricter limit on expensive endpoints like search or login — that value is what the counter check below is measured against.'],
    [3, 'Each request increments a counter keyed by client + time window; if the count exceeds the configured limit the request is rejected before reaching the app server. Either outcome is also recorded to Monitoring so throttling rates stay visible on a dashboard.'],
    [5, "If the request was within limits, it's forwarded on to the App Server to be handled normally — throttled requests never make it this far."],
  ],
};
