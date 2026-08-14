import { describe, expect, it } from 'vitest';
import { TEMPLATE_OPTIONS, buildGraphData, templateToData, toWalkthrough } from '../../data/templates';
import { parse } from '../../lib/io';
import { NODE_W, NODE_H } from '../../lib/geometry';

function boxesOverlap(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return a.x < b.x + NODE_W && a.x + NODE_W > b.x && a.y < b.y + NODE_H && a.y + NODE_H > b.y;
}

function fullyInside(n: { x: number; y: number }, r: { x: number; y: number; w: number; h: number }): boolean {
  return n.x > r.x && n.y > r.y && n.x + NODE_W < r.x + r.w && n.y + NODE_H < r.y + r.h;
}

function fullyOutside(n: { x: number; y: number }, r: { x: number; y: number; w: number; h: number }): boolean {
  return n.x + NODE_W <= r.x || n.x >= r.x + r.w || n.y + NODE_H <= r.y || n.y >= r.y + r.h;
}

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

  it('every template carries a walkthrough whose steps are real, ordered node ids '
    + 'with a real edge connecting each consecutive pair', () => {
    for (const { key } of TEMPLATE_OPTIONS) {
      const data = templateToData(key);
      expect(data.walkthrough).toBeDefined();
      const steps = data.walkthrough ?? [];
      expect(steps.length).toBeGreaterThan(0);
      const ids = new Set(data.nodes.map((n) => n.id));
      for (const step of steps) {
        expect(ids.has(step.nodeId)).toBe(true);
        expect(step.text.length).toBeGreaterThan(0);
      }
      for (let i = 1; i < steps.length; i++) {
        const prev = steps[i - 1].nodeId;
        const cur = steps[i].nodeId;
        const connected = data.edges.some(
          (e) => (e.from === prev && e.to === cur) || (e.from === cur && e.to === prev),
        );
        expect(connected).toBe(true);
      }
    }
  });

  it('no two node bounding boxes overlap, and every region fully contains or fully '
    + 'excludes each node (never clips one), for every template', () => {
    for (const { key } of TEMPLATE_OPTIONS) {
      const data = templateToData(key);
      for (let i = 0; i < data.nodes.length; i++) {
        for (let j = i + 1; j < data.nodes.length; j++) {
          expect(boxesOverlap(data.nodes[i], data.nodes[j])).toBe(false);
        }
      }
      for (const region of data.regions) {
        for (const node of data.nodes) {
          expect(fullyInside(node, region) || fullyOutside(node, region)).toBe(true);
        }
      }
    }
  });

  it('toWalkthrough resolves authored tuples to node ids, and returns undefined '
    + 'when a template defines none', () => {
    const nodes = [
      { id: 'n1', key: 'a', icon: 'a', label: 'A', x: 0, y: 0 },
      { id: 'n2', key: 'b', icon: 'b', label: 'B', x: 200, y: 0 },
    ];
    const withSteps = toWalkthrough(
      { nodes: [], edges: [], regions: [], walkthrough: [[1, 'second'], [0, 'first']] },
      nodes,
    );
    expect(withSteps).toEqual([{ nodeId: 'n2', text: 'second' }, { nodeId: 'n1', text: 'first' }]);
    expect(toWalkthrough({ nodes: [], edges: [], regions: [] }, nodes)).toBeUndefined();
  });

  it('buildGraphData omits the walkthrough field entirely when a template defines none', () => {
    const data = buildGraphData({
      nodes: [{ key: 'a', icon: 'a', label: 'A', x: 0, y: 0 }],
      edges: [],
      regions: [],
    });
    expect(data.walkthrough).toBeUndefined();
    expect('walkthrough' in data).toBe(false);
  });
});
