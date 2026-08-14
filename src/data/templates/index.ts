import type { GraphData, GraphNode, Region, WalkStep } from '../../types';
import type { Tpl } from './types';
import { url } from './url';
import { chat } from './chat';
import { feed } from './feed';
import { rateLimiter } from './rateLimiter';
import { rideSharing } from './rideSharing';
import { videoStreaming } from './videoStreaming';
import { notifications } from './notificationSystem';

export type TemplateKey =
  | 'url' | 'chat' | 'feed' | 'rateLimiter' | 'rideSharing' | 'videoStreaming' | 'notifications';

export const TEMPLATE_OPTIONS: Array<{ key: TemplateKey; label: string }> = [
  { key: 'url', label: 'URL Shortener' },
  { key: 'chat', label: 'Chat App' },
  { key: 'feed', label: 'News Feed' },
  { key: 'rateLimiter', label: 'Rate Limiter' },
  { key: 'rideSharing', label: 'Ride Sharing' },
  { key: 'videoStreaming', label: 'Video Streaming' },
  { key: 'notifications', label: 'Notification System' },
];

const TEMPLATES: Record<TemplateKey, Tpl> = {
  url, chat, feed, rateLimiter, rideSharing, videoStreaming, notifications,
};

/** Resolve a template's optional `[nodeIndex, text]` walkthrough tuples into real
 *  WalkSteps against its already-generated nodes. Exported standalone (rather than
 *  inlined in `templateToData`) so both the "has steps" and "no steps" branches are
 *  independently unit-testable without depending on which real templates opt in. */
export function toWalkthrough(t: Tpl, nodes: GraphNode[]): WalkStep[] | undefined {
  if (!t.walkthrough) return undefined;
  return t.walkthrough.map(([i, text]) => ({ nodeId: nodes[i].id, text }));
}

/** Expand a template into a full GraphData with generated ids. Split from
 *  `templateToData` so the branch-on-undefined-walkthrough logic is unit-testable
 *  against a synthetic `Tpl`, independent of the real templates in `TEMPLATES`. */
export function buildGraphData(t: Tpl): GraphData {
  const nodes: GraphNode[] = t.nodes.map((n, i) => ({ id: `n${i + 1}`, ...n }));
  const edges = t.edges.map(([a, b, label], i) => ({ id: `e${i + 1}`, from: nodes[a].id, to: nodes[b].id, label }));
  const regions: Region[] = t.regions.map((r, i) => ({ id: `r${i + 1}`, ...r }));
  const walkthrough = toWalkthrough(t, nodes);
  return walkthrough ? { nodes, edges, regions, walkthrough } : { nodes, edges, regions };
}

/** Expand a template into a full GraphData with generated ids. */
export function templateToData(key: TemplateKey): GraphData {
  return buildGraphData(TEMPLATES[key]);
}
