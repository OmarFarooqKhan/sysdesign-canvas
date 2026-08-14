import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listSaves, loadSave, removeSave, saveAs } from '../../lib/library';
import type { GraphData } from '../../types';

const data: GraphData = {
  edgeMode: 'curved',
  nodes: [{ id: 'n1', key: 'server', icon: 'server', label: 'API', x: 1, y: 2 }],
  edges: [],
  regions: [],
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('library', () => {
  it('listSaves is empty when nothing has been saved', () => {
    expect(listSaves()).toEqual([]);
  });

  it('saveAs stores a diagram, listed and loadable by name', () => {
    saveAs('My Diagram', data);
    expect(listSaves()).toEqual(['My Diagram']);
    expect(loadSave('My Diagram')).toEqual(data);
  });

  it('listSaves is alphabetically sorted', () => {
    saveAs('Zebra', data);
    saveAs('Apple', data);
    expect(listSaves()).toEqual(['Apple', 'Zebra']);
  });

  it('saveAs on an existing name overwrites without duplicating the index', () => {
    saveAs('Doc', data);
    saveAs('Doc', { ...data, edgeMode: 'ortho' });
    expect(listSaves()).toEqual(['Doc']);
    expect(loadSave('Doc')?.edgeMode).toBe('ortho');
  });

  it('loadSave returns null for a missing name', () => {
    expect(loadSave('nope')).toBeNull();
  });

  it('loadSave returns null when the stored document is corrupt', () => {
    localStorage.setItem('sysdesign-canvas:save:Bad', 'not json');
    expect(loadSave('Bad')).toBeNull();
  });

  it('removeSave deletes the document and its index entry', () => {
    saveAs('Doc', data);
    removeSave('Doc');
    expect(listSaves()).toEqual([]);
    expect(loadSave('Doc')).toBeNull();
  });

  it('removeSave on a name that was never saved is a no-op', () => {
    expect(() => removeSave('nope')).not.toThrow();
    expect(listSaves()).toEqual([]);
  });

  it('listSaves recovers from a corrupt index', () => {
    localStorage.setItem('sysdesign-canvas:library', 'not json');
    expect(listSaves()).toEqual([]);
  });

  it('listSaves ignores a non-array or non-string-entry index', () => {
    localStorage.setItem('sysdesign-canvas:library', JSON.stringify({ not: 'an array' }));
    expect(listSaves()).toEqual([]);
    localStorage.setItem('sysdesign-canvas:library', JSON.stringify(['ok', 5, null]));
    expect(listSaves()).toEqual(['ok']);
  });

  it('saveAs swallows a storage error and does not index the failed save', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(() => saveAs('Doc', data)).not.toThrow();
    vi.restoreAllMocks();
    expect(listSaves()).toEqual([]);
  });

  it('swallows a storage error writing the index, independent of the document write', () => {
    const realSetItem = Storage.prototype.setItem.bind(localStorage);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      if (key === 'sysdesign-canvas:library') throw new Error('quota');
      realSetItem(key, value);
    });
    expect(() => saveAs('Doc', data)).not.toThrow();
  });
});
