import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { EdgeMode, GraphData } from '../types';
import { parse } from './io';

/** Encode the diagram as a shareable URL for the current origin/path, with the compressed
 *  document in the hash fragment so it never hits a server. */
export function encodeShare(data: GraphData): string {
  const url = new URL(window.location.href);
  url.hash = compressToEncodedURIComponent(JSON.stringify(data));
  return url.toString();
}

/** Decode a `location.hash` payload back into a diagram, validated through parse().
 *  Null when the hash is empty or the payload is corrupt. */
export function decodeShare(hash: string): (GraphData & { edgeMode: EdgeMode }) | null {
  const payload = hash.replace(/^#/, '');
  if (!payload) return null;
  const json = decompressFromEncodedURIComponent(payload);
  if (!json) return null;
  try {
    return parse(json);
  } catch {
    return null;
  }
}
