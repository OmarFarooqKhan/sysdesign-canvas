import { describe, expect, it } from 'vitest';
import { TEMPLATE_OPTIONS, templateToData } from './templates';

describe('templates', () => {
  it('exposes three template options', () => {
    expect(TEMPLATE_OPTIONS.map((o) => o.key)).toEqual(['url', 'chat', 'feed']);
  });

  it('expands each template into a valid, id-consistent GraphData', () => {
    for (const { key } of TEMPLATE_OPTIONS) {
      const data = templateToData(key);
      const ids = new Set(data.nodes.map((n) => n.id));
      expect(data.nodes.length).toBeGreaterThan(0);
      expect(data.regions.length).toBeGreaterThan(0);
      // every edge references real node ids
      for (const e of data.edges) {
        expect(ids.has(e.from)).toBe(true);
        expect(ids.has(e.to)).toBe(true);
      }
      // ids are generated deterministically
      expect(data.nodes[0].id).toBe('n1');
      expect(data.regions[0].id).toBe('r1');
    }
  });

  it('maps edge tuples to the right endpoints (url template)', () => {
    const d = templateToData('url');
    expect(d.edges[0]).toMatchObject({ from: 'n1', to: 'n2', label: 'HTTPS' });
  });
});
