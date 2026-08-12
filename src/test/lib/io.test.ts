import { afterEach, describe, expect, it, vi } from 'vitest';
import { download, parse, toData } from './io';
import type { GraphState } from '../types';

const state: GraphState = {
  nodes: { n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 1, y: 2 } },
  edges: [{ id: 'e1', from: 'n1', to: 'n1', label: '' }],
  regions: [{ id: 'r1', title: 'R', x: 0, y: 0, w: 200, h: 150, color: '#fff' }],
  seq: 1,
};

afterEach(() => vi.restoreAllMocks());

describe('io', () => {
  it('toData snapshots the graph with the edge mode', () => {
    const d = toData(state, 'ortho');
    expect(d).toEqual({ edgeMode: 'ortho', nodes: [state.nodes.n1], edges: state.edges, regions: state.regions });
  });

  it('download creates a blob url, clicks an anchor and revokes', () => {
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    download(toData(state, 'curved'));
    expect(create).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith('blob:x');
  });

  it('parse accepts a valid diagram and normalizes edgeMode', () => {
    const json = JSON.stringify({ nodes: [], edges: [], regions: [] });
    expect(parse(json).edgeMode).toBe('curved');
    expect(parse(JSON.stringify({ edgeMode: 'ortho', nodes: [], edges: [], regions: [] })).edgeMode).toBe('ortho');
  });

  it('parse throws on malformed input', () => {
    expect(() => parse(JSON.stringify({ nodes: [] }))).toThrow(/expected nodes/);
  });
});
