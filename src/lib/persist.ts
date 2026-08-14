import type { EdgeMode, GraphData } from '../types';
import { parse } from './io';

const STORAGE_KEY = 'sysdesign-canvas:autosave';

/** Persist the diagram to localStorage. Best-effort: swallows quota/serialization errors. */
export function saveLocal(data: GraphData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable — autosave is best-effort
  }
}

/** Load the autosaved diagram, validated through parse(). Null when missing or corrupt. */
export function loadLocal(): (GraphData & { edgeMode: EdgeMode }) | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return parse(raw);
  } catch {
    return null;
  }
}
