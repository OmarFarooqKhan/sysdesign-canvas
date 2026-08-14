import { describe, expect, it } from 'vitest';
import { compressToEncodedURIComponent } from 'lz-string';
import { decodeShare, encodeShare } from '../../lib/shareUrl';
import type { GraphData } from '../../types';

const data: GraphData = {
  edgeMode: 'ortho',
  nodes: [{ id: 'n1', key: 'server', icon: 'server', label: 'API', x: 1, y: 2 }],
  edges: [],
  regions: [],
};

describe('shareUrl', () => {
  it('round-trips a diagram through encode + decode', () => {
    const url = encodeShare(data);
    const hash = new URL(url).hash;
    expect(decodeShare(hash)).toEqual(data);
  });

  it('encodeShare keeps the current origin and path, only setting the hash', () => {
    const url = new URL(encodeShare(data));
    expect(url.origin + url.pathname).toBe(window.location.origin + window.location.pathname);
    expect(url.hash.length).toBeGreaterThan(1);
  });

  it('decodeShare accepts a hash with or without the leading "#"', () => {
    const hash = new URL(encodeShare(data)).hash;
    expect(decodeShare(hash)).toEqual(data);
    expect(decodeShare(hash.slice(1))).toEqual(data);
  });

  it('decodeShare returns null for an empty or absent hash', () => {
    expect(decodeShare('')).toBeNull();
    expect(decodeShare('#')).toBeNull();
  });

  it('decodeShare returns null for a payload that fails to decompress', () => {
    expect(decodeShare('#not-a-valid-compressed-payload')).toBeNull();
  });

  it('decodeShare returns null when the decompressed payload is not a valid diagram', () => {
    const hash = compressToEncodedURIComponent(JSON.stringify({ foo: 'bar' }));
    expect(decodeShare(`#${hash}`)).toBeNull();
  });
});
