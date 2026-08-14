import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSvg, downloadSvg } from '../../lib/exportSvg';
import { NODE_H, NODE_W, edgeEndpoints, insetEndpoints } from '../../lib/geometry';
import { bowEndpoints } from '../../lib/edgeBend';
import { edgePath } from '../../lib/edgePath';
import type { GraphState } from '../../types';

const oneNode: GraphState = {
  nodes: { n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 10, y: 20 } },
  edges: [],
  regions: [],
  seq: 1,
};

function twoNodesEdge(bidirectional = false): GraphState {
  return {
    nodes: {
      n1: { id: 'n1', key: 'server', icon: 'server', label: 'A', x: 0, y: 0 },
      n2: { id: 'n2', key: 'server', icon: 'server', label: 'B', x: 300, y: 0 },
    },
    edges: [{ id: 'e1', from: 'n1', to: 'n2', label: 'calls', bidirectional }],
    regions: [],
    seq: 2,
  };
}

afterEach(() => vi.restoreAllMocks());

describe('buildSvg', () => {
  it('is a no-op ("") for an empty canvas', () => {
    expect(buildSvg({ nodes: {}, edges: [], regions: [], seq: 0 }, 'curved')).toBe('');
  });

  it('includes the arrow marker def', () => {
    const svg = buildSvg(oneNode, 'curved');
    expect(svg).toContain('<marker id="arrow"');
    expect(svg).toContain('orient="auto-start-reverse"');
  });

  it("renders a node's rect at its exact coordinates", () => {
    const svg = buildSvg(oneNode, 'curved');
    expect(svg).toContain(`<rect x="10" y="20" width="${NODE_W}" height="${NODE_H}" rx="14"`);
  });

  it('is a self-contained root <svg> with a viewBox and a background rect', () => {
    const svg = buildSvg(oneNode, 'curved');
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="[-\d.]+ [-\d.]+ [\d.]+ [\d.]+"/);
    expect(svg).toContain('fill="#0f1420"');
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it("an edge's d matches edgePath's output for the same geometry (and autoBend default)", () => {
    const state = twoNodesEdge();
    const svg = buildSvg(state, 'curved');
    const a = edgeEndpoints(state.nodes.n1, state.nodes.n2);
    const { sx, sy, tx, ty } = insetEndpoints(a.sx, a.sy, a.tx, a.ty, false);
    const bowed = bowEndpoints(sx, sy, tx, ty, 0); // no reciprocal edge -> autoBend is 0
    const d = edgePath('curved', bowed.sx, bowed.sy, bowed.tx, bowed.ty, 0);
    expect(svg).toContain(`d="${d}"`);
  });

  it('bidirectional edges carry marker-start', () => {
    const svg = buildSvg(twoNodesEdge(true), 'curved');
    expect(svg).toContain('marker-start="url(#arrow)"');
  });

  it('renders regions as a dashed rect + title', () => {
    const state: GraphState = {
      nodes: {},
      edges: [],
      regions: [{ id: 'r1', title: 'Zone', x: 0, y: 0, w: 200, h: 150, color: '#4f8cff' }],
      seq: 1,
    };
    const svg = buildSvg(state, 'curved');
    expect(svg).toContain('>Zone</text>');
  });

  it('skips a dangling edge (endpoint node missing) without throwing', () => {
    const state: GraphState = {
      nodes: { n1: { id: 'n1', key: 'server', icon: 'server', label: 'A', x: 0, y: 0 } },
      edges: [{ id: 'e1', from: 'n1', to: 'missing', label: '' }],
      regions: [],
      seq: 1,
    };
    expect(() => buildSvg(state, 'curved')).not.toThrow();
    // No edge path (only edges carry marker-end) — icon markup can itself contain <path>.
    expect(buildSvg(state, 'curved')).not.toContain('marker-end');
  });
});

describe('downloadSvg', () => {
  it('is a no-op on an empty canvas (no anchor click)', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadSvg({ nodes: {}, edges: [], regions: [], seq: 0 }, 'curved');
    expect(click).not.toHaveBeenCalled();
  });

  it('builds the svg, creates a blob url, and clicks a download anchor', () => {
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadSvg(oneNode, 'curved', 'diagram.svg');
    expect(create).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith('blob:x');
  });
});
