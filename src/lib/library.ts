import type { EdgeMode, GraphData } from '../types';
import { parse } from './io';

const INDEX_KEY = 'sysdesign-canvas:library';
const docKey = (name: string): string => `sysdesign-canvas:save:${name}`;

function readIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n): n is string => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

function writeIndex(names: string[]): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(names));
  } catch {
    // storage full or unavailable — best-effort
  }
}

/** Names of saved diagrams, alphabetically sorted. */
export function listSaves(): string[] {
  return readIndex().sort((a, b) => a.localeCompare(b));
}

/** Save (or overwrite) a named diagram. */
export function saveAs(name: string, data: GraphData): void {
  try {
    localStorage.setItem(docKey(name), JSON.stringify(data));
  } catch {
    return;
  }
  const names = readIndex();
  if (!names.includes(name)) writeIndex([...names, name]);
}

/** Load a named diagram, validated through parse(). Null when missing or corrupt. */
export function loadSave(name: string): (GraphData & { edgeMode: EdgeMode }) | null {
  const raw = localStorage.getItem(docKey(name));
  if (!raw) return null;
  try {
    return parse(raw);
  } catch {
    return null;
  }
}

/** Delete a named diagram. */
export function removeSave(name: string): void {
  localStorage.removeItem(docKey(name));
  writeIndex(readIndex().filter((n) => n !== name));
}
