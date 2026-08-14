import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadLocal, saveLocal } from '../../lib/persist';
import type { GraphData } from '../../types';

const KEY = 'sysdesign-canvas:autosave';

const data: GraphData = {
  edgeMode: 'ortho',
  nodes: [{ id: 'n1', key: 'server', icon: 'server', label: 'API', x: 1, y: 2 }],
  edges: [],
  regions: [],
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('persist', () => {
  it('loadLocal returns null when nothing is stored', () => {
    expect(loadLocal()).toBeNull();
  });

  it('round-trips a saved diagram', () => {
    saveLocal(data);
    expect(loadLocal()).toEqual(data);
  });

  it('loadLocal returns null on corrupt stored JSON', () => {
    localStorage.setItem(KEY, 'not json');
    expect(loadLocal()).toBeNull();
  });

  it('saveLocal swallows storage errors (e.g. quota exceeded)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(() => saveLocal(data)).not.toThrow();
    expect(loadLocal()).toBeNull();
  });
});
