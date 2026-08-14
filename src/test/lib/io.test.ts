import { afterEach, describe, expect, it, vi } from 'vitest';
import { download, parse, toData } from '../../lib/io';
import type { GraphState } from '../../types';

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

  it('round-trips a node with db schema data through export (toData) and import (parse)', () => {
    const withDb: GraphState = {
      ...state,
      nodes: {
        n1: {
          ...state.nodes.n1,
          key: 'sql',
          db: {
            tables: [{
              name: 'orders',
              columns: [{ name: 'id', type: 'uuid', pk: true }, { name: 'user_id', fk: 'users.id' }],
              shardKey: 'user_id',
              indexes: ['idx_user_id'],
              constraints: ['unique(id)'],
            }],
          },
        },
      },
    };
    const exported = toData(withDb, 'curved');
    const imported = parse(JSON.stringify(exported));
    expect(imported.nodes[0].db).toEqual(withDb.nodes.n1.db);
  });

  it('round-trips a node with notes through export (toData) and import (parse)', () => {
    const withNotes: GraphState = {
      ...state,
      nodes: { n1: { ...state.nodes.n1, notes: '~10k QPS, 500GB storage' } },
    };
    const exported = toData(withNotes, 'curved');
    const imported = parse(JSON.stringify(exported));
    expect(imported.nodes[0].notes).toBe('~10k QPS, 500GB storage');
  });

  it('round-trips a walkthrough through export (toData) and import (parse)', () => {
    const walkthrough = [{ nodeId: 'n1', text: 'the request lands here' }];
    const exported = toData({ ...state, walkthrough }, 'curved');
    expect(exported.walkthrough).toEqual(walkthrough);
    expect(parse(JSON.stringify(exported)).walkthrough).toEqual(walkthrough);
  });

  it('omits walkthrough from toData and parse when the graph has none', () => {
    const exported = toData(state, 'curved');
    expect('walkthrough' in exported).toBe(false);
    const imported = parse(JSON.stringify(exported));
    expect('walkthrough' in imported).toBe(false);
  });

  it('parse silently drops a malformed walkthrough but keeps the rest of the diagram', () => {
    const body = { nodes: [], edges: [], regions: [] };
    const bad: unknown[] = [
      'nope',
      { nodeId: 'n1', text: 'x' },
      [5],
      [null],
      [{ text: 'missing node id' }],
      [{ nodeId: 'n1' }],
      [{ nodeId: 7, text: 'x' }],
      [{ nodeId: 'n1', text: 7 }],
      [{ nodeId: 'n1', text: 'ok' }, { nodeId: 'n2' }],
    ];
    for (const walkthrough of bad) {
      const imported = parse(JSON.stringify({ ...body, walkthrough }));
      expect('walkthrough' in imported).toBe(false);
      expect(imported.nodes).toEqual([]);
    }
    // A well-formed (even empty) walkthrough is kept.
    expect(parse(JSON.stringify({ ...body, walkthrough: [] })).walkthrough).toEqual([]);
  });
});
