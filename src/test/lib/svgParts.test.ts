import { describe, expect, it } from 'vitest';
import { escapeXml, svgEdge, svgNode, svgRegion } from '../../lib/svgParts';
import { NODE_H, NODE_W, edgeEndpoints, insetEndpoints } from '../../lib/geometry';
import { bowEndpoints } from '../../lib/edgeBend';
import { edgePath } from '../../lib/edgePath';
import type { Edge, GraphNode, Region } from '../../types';

describe('escapeXml', () => {
  it('escapes &, <, >, and "', () => {
    expect(escapeXml('a & b < c > d " e')).toBe('a &amp; b &lt; c &gt; d &quot; e');
  });

  it('leaves plain text untouched', () => {
    expect(escapeXml('Hello World')).toBe('Hello World');
  });
});

describe('svgNode', () => {
  it("renders a rect at the node's exact coordinates, sized NODE_W x NODE_H", () => {
    const n: GraphNode = { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 10, y: 20 };
    expect(svgNode(n)).toContain(`<rect x="10" y="20" width="${NODE_W}" height="${NODE_H}" rx="14"`);
  });

  it('embeds the icon markup with explicit x/y/width/height', () => {
    const n: GraphNode = { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 0, y: 0 };
    expect(svgNode(n)).toMatch(/<svg x="[\d.]+" y="[\d.]+" width="34" height="34"/);
  });

  it('renders no icon markup for an unknown icon, without throwing', () => {
    const n: GraphNode = { id: 'n1', key: 'x', icon: 'does-not-exist', label: 'X', x: 0, y: 0 };
    expect(() => svgNode(n)).not.toThrow();
    expect(svgNode(n)).not.toContain('does-not-exist');
  });

  it('escapes the label text', () => {
    const n: GraphNode = { id: 'n1', key: 'server', icon: 'server', label: '<script>', x: 0, y: 0 };
    expect(svgNode(n)).toContain('&lt;script&gt;');
    expect(svgNode(n)).not.toContain('<script>');
  });
});

describe('svgRegion', () => {
  it('renders a dashed rect using the region color, plus a title text', () => {
    const r: Region = { id: 'r1', title: 'Edge', x: 5, y: 6, w: 200, h: 150, color: '#4f8cff' };
    const svg = svgRegion(r);
    expect(svg).toContain('<rect x="5" y="6" width="200" height="150" rx="12" fill="#4f8cff"');
    expect(svg).toContain('stroke-dasharray="5,4"');
    expect(svg).toContain('>Edge</text>');
  });

  it('escapes the title and color', () => {
    const r: Region = { id: 'r1', title: 'A & B', x: 0, y: 0, w: 100, h: 100, color: '#fff' };
    expect(svgRegion(r)).toContain('A &amp; B');
  });
});

describe('svgEdge', () => {
  const from: GraphNode = { id: 'n1', key: 'server', icon: 'server', label: 'A', x: 0, y: 0 };
  const to: GraphNode = { id: 'n2', key: 'server', icon: 'server', label: 'B', x: 300, y: 0 };

  function expectedD(bend: number, bidirectional: boolean, mode: 'curved' | 'ortho' = 'curved') {
    const a = edgeEndpoints(from, to);
    const { sx, sy, tx, ty } = insetEndpoints(a.sx, a.sy, a.tx, a.ty, bidirectional);
    const bowed = bowEndpoints(sx, sy, tx, ty, bend);
    return edgePath(mode, bowed.sx, bowed.sy, bowed.tx, bowed.ty, bend);
  }

  it("path d matches edgePath's own output for the same geometry", () => {
    const edge: Edge = { id: 'e1', from: 'n1', to: 'n2', label: '' };
    const svg = svgEdge(edge, from, to, 'curved', 0);
    expect(svg).toContain(`d="${expectedD(0, false)}"`);
    expect(svg).toContain('marker-end="url(#arrow)"');
  });

  it('renders ortho-mode paths too', () => {
    const edge: Edge = { id: 'e1', from: 'n1', to: 'n2', label: '' };
    const svg = svgEdge(edge, from, to, 'ortho', 0);
    expect(svg).toContain(`d="${expectedD(0, false, 'ortho')}"`);
  });

  it('bidirectional edges also carry marker-start', () => {
    const edge: Edge = { id: 'e1', from: 'n1', to: 'n2', label: '', bidirectional: true };
    const svg = svgEdge(edge, from, to, 'curved', 0);
    expect(svg).toContain('marker-start="url(#arrow)"');
    expect(svg).toContain(`d="${expectedD(0, true)}"`);
  });

  it('one-way edges omit marker-start', () => {
    const edge: Edge = { id: 'e1', from: 'n1', to: 'n2', label: '' };
    expect(svgEdge(edge, from, to, 'curved', 0)).not.toContain('marker-start');
  });

  it('a manual edge.bend overrides the passed-in default bend', () => {
    const edge: Edge = { id: 'e1', from: 'n1', to: 'n2', label: '', bend: 15 };
    const svg = svgEdge(edge, from, to, 'curved', 999);
    expect(svg).toContain(`d="${expectedD(15, false)}"`);
  });

  it('falls back to the default bend when edge.bend is unset', () => {
    const edge: Edge = { id: 'e1', from: 'n1', to: 'n2', label: '' };
    const svg = svgEdge(edge, from, to, 'curved', 12);
    expect(svg).toContain(`d="${expectedD(12, false)}"`);
  });

  it('renders an escaped label text when present', () => {
    const edge: Edge = { id: 'e1', from: 'n1', to: 'n2', label: 'A & B' };
    expect(svgEdge(edge, from, to, 'curved', 0)).toContain('A &amp; B');
  });

  it('omits the label text entirely when empty', () => {
    const edge: Edge = { id: 'e1', from: 'n1', to: 'n2', label: '' };
    expect(svgEdge(edge, from, to, 'curved', 0)).not.toContain('<text');
  });
});
