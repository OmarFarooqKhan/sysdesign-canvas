import { describe, expect, it } from 'vitest';
import { offsetClipboard, snapshotSelection } from '../../lib/clipboard';
import type { GraphState } from '../../types';

const state: GraphState = {
  nodes: {
    n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 10, y: 20 },
    n2: { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 100, y: 200 },
    n3: { id: 'n3', key: 'cache', icon: 'cache', label: 'Cache', x: 300, y: 400 },
  },
  edges: [
    { id: 'e1', from: 'n1', to: 'n2', label: 'internal' }, // both endpoints selected
    { id: 'e2', from: 'n1', to: 'n3', label: 'external' }, // only one endpoint selected
    { id: 'e3', from: 'n3', to: 'n2', label: 'unrelated' }, // neither endpoint selected
  ],
  regions: [],
  seq: 3,
};

describe('snapshotSelection', () => {
  it('captures the selected nodes plus only the edges whose both endpoints are selected', () => {
    const clip = snapshotSelection(state, ['n1', 'n2']);
    expect(clip.nodes.map((n) => n.id)).toEqual(['n1', 'n2']);
    expect(clip.edges).toEqual([{ id: 'e1', from: 'n1', to: 'n2', label: 'internal' }]);
  });

  it('returns no edges when only one node is selected', () => {
    const clip = snapshotSelection(state, ['n1']);
    expect(clip.nodes.map((n) => n.id)).toEqual(['n1']);
    expect(clip.edges).toEqual([]);
  });

  it('returns empty clipboard data for an empty selection', () => {
    expect(snapshotSelection(state, [])).toEqual({ nodes: [], edges: [] });
  });
});

describe('offsetClipboard', () => {
  it('offsets every node position by +16/+16 by default, leaving edges untouched', () => {
    const clip = snapshotSelection(state, ['n1', 'n2']);
    const out = offsetClipboard(clip);
    expect(out.nodes).toEqual([
      { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 26, y: 36 },
      { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 116, y: 216 },
    ]);
    expect(out.edges).toBe(clip.edges);
  });

  it('accepts a custom offset', () => {
    const clip = snapshotSelection(state, ['n1']);
    const out = offsetClipboard(clip, 5, -3);
    expect(out.nodes[0]).toMatchObject({ x: 15, y: 17 });
  });

  it('does not mutate the original clipboard data', () => {
    const clip = snapshotSelection(state, ['n1']);
    offsetClipboard(clip);
    expect(clip.nodes[0]).toMatchObject({ x: 10, y: 20 });
  });
});
