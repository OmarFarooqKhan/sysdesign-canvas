import { describe, expect, it } from 'vitest';
import {
  DOT_COLOR, PANEL_W, activeStepNodeId, clampStep, hasWalkStep, hopForStep, panToStep, parkPoint, resolveSteps,
} from '../../lib/playthrough';
import { edgeEndpoints, insetEndpoints } from '../../lib/geometry';
import { bowEndpoints, edgeMidpoint } from '../../lib/edgeBend';
import { edgePath } from '../../lib/edgePath';
import { autoBend } from '../../lib/reciprocalBend';
import type { Edge, EdgeMode, GraphState } from '../../types';

const mk = (over?: Partial<GraphState>): GraphState => ({
  nodes: {
    n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 100, y: 100 },
    n2: { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 300, y: 100 },
    n3: { id: 'n3', key: 'cache', icon: 'cache', label: 'Cache', x: 300, y: 300 },
  },
  edges: [],
  regions: [],
  seq: 3,
  ...over,
});

/** EdgeView's exact geometry pipeline, composed from the same helpers, so hop tests
 *  prove the dot rides precisely what is drawn. */
function edgeViewPath(state: GraphState, edge: Edge, mode: EdgeMode) {
  const from = state.nodes[edge.from];
  const to = state.nodes[edge.to];
  const bend = edge.bend ?? autoBend(state.edges, edge, from, to);
  const a = edgeEndpoints(from, to);
  const i = insetEndpoints(a.sx, a.sy, a.tx, a.ty, !!edge.bidirectional);
  const b = bowEndpoints(i.sx, i.sy, i.tx, i.ty, bend);
  return { d: edgePath(mode, b.sx, b.sy, b.tx, b.ty, bend), mid: edgeMidpoint(mode, b.sx, b.sy, b.tx, b.ty, bend) };
}

describe('resolveSteps', () => {
  it('returns [] when there is no walkthrough', () => {
    expect(resolveSteps(mk())).toEqual([]);
  });

  it('skips steps whose node no longer exists, preserving order', () => {
    const s = mk({ walkthrough: [
      { nodeId: 'n3', text: 'c' }, { nodeId: 'ghost', text: 'x' }, { nodeId: 'n1', text: 'a' },
    ] });
    const out = resolveSteps(s);
    expect(out.map((r) => r.node.id)).toEqual(['n3', 'n1']);
    expect(out.map((r) => r.step.text)).toEqual(['c', 'a']);
  });

  it('keeps duplicate node visits (the array already supports v2 routes)', () => {
    const s = mk({ walkthrough: [
      { nodeId: 'n1', text: 'req' }, { nodeId: 'n2', text: 'db' }, { nodeId: 'n1', text: 'resp' },
    ] });
    expect(resolveSteps(s).map((r) => r.node.id)).toEqual(['n1', 'n2', 'n1']);
  });
});

describe('hasWalkStep', () => {
  it('is false with no walkthrough, false for unstepped nodes, true for stepped ones', () => {
    expect(hasWalkStep(mk(), 'n1')).toBe(false);
    const s = mk({ walkthrough: [{ nodeId: 'n1', text: 'a' }] });
    expect(hasWalkStep(s, 'n1')).toBe(true);
    expect(hasWalkStep(s, 'n2')).toBe(false);
  });
});

describe('clampStep', () => {
  it('clamps into [0, count-1] and returns 0 for an empty tour', () => {
    expect(clampStep(1, 3)).toBe(1);
    expect(clampStep(5, 3)).toBe(2);
    expect(clampStep(-2, 3)).toBe(0);
    expect(clampStep(0, 0)).toBe(0);
  });
});

describe('activeStepNodeId', () => {
  it('is null with no steps, else the clamped step node id', () => {
    expect(activeStepNodeId(mk(), 0)).toBeNull();
    const s = mk({ walkthrough: [{ nodeId: 'n1', text: 'a' }, { nodeId: 'n2', text: 'b' }] });
    expect(activeStepNodeId(s, 0)).toBe('n1');
    expect(activeStepNodeId(s, 1)).toBe('n2');
    expect(activeStepNodeId(s, 99)).toBe('n2');
  });
});

describe('hopForStep', () => {
  const walkthrough = [{ nodeId: 'n1', text: 'a' }, { nodeId: 'n2', text: 'b' }];

  it('is null for step 0 and for out-of-range indices', () => {
    const s = mk({ walkthrough, edges: [{ id: 'e1', from: 'n1', to: 'n2', label: '' }] });
    const resolved = resolveSteps(s);
    expect(hopForStep(s, 'curved', resolved, 0)).toBeNull();
    expect(hopForStep(s, 'curved', resolved, 2)).toBeNull();
  });

  it('builds the forward edge exactly as EdgeView draws it', () => {
    const s = mk({ walkthrough, edges: [{ id: 'e1', from: 'n1', to: 'n2', label: '' }] });
    const hop = hopForStep(s, 'curved', resolveSteps(s), 1)!;
    const drawn = edgeViewPath(s, s.edges[0], 'curved');
    expect(hop).toEqual({ d: drawn.d, reverse: false, edgeId: 'e1', mid: drawn.mid });
  });

  it('flags a reversed edge and keeps the path as drawn (from -> to)', () => {
    const s = mk({ walkthrough, edges: [{ id: 'e9', from: 'n2', to: 'n1', label: '' }] });
    const hop = hopForStep(s, 'curved', resolveSteps(s), 1)!;
    const drawn = edgeViewPath(s, s.edges[0], 'curved');
    expect(hop).toEqual({ d: drawn.d, reverse: true, edgeId: 'e9', mid: drawn.mid });
  });

  it('insets both endpoints for a bidirectional edge, like EdgeView', () => {
    const s = mk({ walkthrough, edges: [{ id: 'e1', from: 'n1', to: 'n2', label: '', bidirectional: true }] });
    const hop = hopForStep(s, 'curved', resolveSteps(s), 1)!;
    expect(hop.d).toBe(edgeViewPath(s, s.edges[0], 'curved').d);
    const plain = mk({ walkthrough, edges: [{ id: 'e1', from: 'n1', to: 'n2', label: '' }] });
    expect(hop.d).not.toBe(hopForStep(plain, 'curved', resolveSteps(plain), 1)!.d);
  });

  it('honors a manual bend, in both curved and ortho modes', () => {
    const s = mk({ walkthrough, edges: [{ id: 'e1', from: 'n1', to: 'n2', label: '', bend: 30 }] });
    const resolved = resolveSteps(s);
    expect(hopForStep(s, 'curved', resolved, 1)!.d).toBe(edgeViewPath(s, s.edges[0], 'curved').d);
    expect(hopForStep(s, 'ortho', resolved, 1)!.d).toBe(edgeViewPath(s, s.edges[0], 'ortho').d);
    expect(hopForStep(s, 'ortho', resolved, 1)!.mid).toEqual(edgeViewPath(s, s.edges[0], 'ortho').mid);
  });

  it('applies the reciprocal-pair auto bend when the edge has no manual bend', () => {
    const edges: Edge[] = [
      { id: 'e1', from: 'n1', to: 'n2', label: '' },
      { id: 'e2', from: 'n2', to: 'n1', label: '' },
    ];
    const s = mk({ walkthrough, edges });
    const hop = hopForStep(s, 'curved', resolveSteps(s), 1)!;
    expect(autoBend(edges, edges[0], s.nodes.n1, s.nodes.n2)).not.toBe(0);
    expect(hop.d).toBe(edgeViewPath(s, edges[0], 'curved').d);
    expect(hop.edgeId).toBe('e1');
  });

  it('falls back to a straight anchor-to-anchor line when no edge connects the nodes', () => {
    const s = mk({ walkthrough });
    const hop = hopForStep(s, 'curved', resolveSteps(s), 1)!;
    const a = edgeEndpoints(s.nodes.n1, s.nodes.n2);
    expect(hop).toEqual({
      d: `M ${a.sx} ${a.sy} L ${a.tx} ${a.ty}`,
      reverse: false,
      edgeId: null,
      mid: { x: (a.sx + a.tx) / 2, y: (a.sy + a.ty) / 2 },
    });
  });
});

describe('parkPoint', () => {
  it('parks on the border anchor facing the second step node', () => {
    const s = mk({ walkthrough: [{ nodeId: 'n1', text: 'a' }, { nodeId: 'n2', text: 'b' }] });
    const a = edgeEndpoints(s.nodes.n1, s.nodes.n2);
    expect(parkPoint(resolveSteps(s))).toEqual({ x: a.sx, y: a.sy });
  });

  it('parks on the left border anchor for a single-step tour', () => {
    const s = mk({ walkthrough: [{ nodeId: 'n1', text: 'a' }] });
    expect(parkPoint(resolveSteps(s))).toEqual({ x: 100, y: 132 });
  });
});

describe('panToStep', () => {
  it('centers the node left of the panel at zoom 1', () => {
    expect(panToStep({ zoom: 1, panX: 5, panY: 5 }, 1000, 600, { x: 200, y: 150 }, PANEL_W + 28)).toEqual({
      panX: (1000 - 256) / 2 - 200,
      panY: 300 - 150,
    });
  });

  it('scales the node center by the current zoom', () => {
    expect(panToStep({ zoom: 2, panX: 0, panY: 0 }, 1000, 600, { x: 200, y: 150 }, 256)).toEqual({
      panX: 372 - 400,
      panY: 300 - 300,
    });
  });
});

describe('constants', () => {
  it('pins the neon dot color and panel width', () => {
    expect(DOT_COLOR).toBe('#39ff14');
    expect(PANEL_W).toBe(228);
  });
});
