import { describe, expect, it } from 'vitest';
import { TEMPLATE_OPTIONS, templateToData } from '../../data/templates';
import { parse } from '../../lib/io';

describe('templates', () => {
  it('exposes seven template options', () => {
    expect(TEMPLATE_OPTIONS.map((o) => o.key)).toEqual([
      'url', 'chat', 'feed', 'rateLimiter', 'rideSharing', 'videoStreaming', 'notifications',
    ]);
  });

  it('expands each template into a valid, id-consistent GraphData that round-trips through parse', () => {
    for (const { key } of TEMPLATE_OPTIONS) {
      const data = templateToData(key);
      const ids = new Set(data.nodes.map((n) => n.id));
      expect(data.nodes.length).toBeGreaterThanOrEqual(6);
      expect(data.nodes.length).toBeLessThanOrEqual(8);
      expect(data.regions.length).toBeGreaterThan(0);
      // every edge references real node ids, in range
      for (const e of data.edges) {
        expect(ids.has(e.from)).toBe(true);
        expect(ids.has(e.to)).toBe(true);
      }
      // ids are generated deterministically and unique
      expect(ids.size).toBe(data.nodes.length);
      expect(data.nodes[0].id).toBe('n1');
      expect(data.regions[0].id).toBe('r1');
      // valid, parseable GraphData
      expect(() => parse(JSON.stringify(data))).not.toThrow();
      expect(parse(JSON.stringify(data)).nodes).toEqual(data.nodes);
    }
  });

  it('maps edge tuples to the right endpoints (url template)', () => {
    const d = templateToData('url');
    expect(d.edges[0]).toMatchObject({ from: 'n1', to: 'n2', label: 'HTTPS' });
  });

  it('every template node uses a valid palette key/icon and has a non-empty label', () => {
    for (const { key } of TEMPLATE_OPTIONS) {
      const data = templateToData(key);
      for (const n of data.nodes) {
        expect(n.key).toBeTruthy();
        expect(n.icon).toBeTruthy();
        expect(n.label.length).toBeGreaterThan(0);
      }
    }
  });
});
