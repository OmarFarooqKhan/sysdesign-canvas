import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { EdgeMode } from '../types';
import type { ClipboardData } from '../lib/clipboard';

export interface UIContextValue {
  /** The lone selected node id, or null when zero or more-than-one nodes are selected. */
  selectedId: string | null;
  /** Full multi-select set; a single selectNode(id) call results in exactly [id]. */
  selectedNodeIds: string[];
  selectedRegionId: string | null;
  selectedEdgeId: string | null;
  edgeMode: EdgeMode;
  /** In-app copy/paste slot: plain data, not serialized, not undoable. */
  clipboard: ClipboardData | null;
  selectNode: (id: string | null) => void;
  selectNodes: (ids: string[]) => void;
  selectRegion: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  clearSelection: () => void;
  toggleEdgeMode: () => void;
  setEdgeMode: (m: EdgeMode) => void;
  setClipboard: (c: ClipboardData | null) => void;
}

const Ctx = createContext<UIContextValue | null>(null);

export function UIProvider({ children, initialEdgeMode }: { children: ReactNode; initialEdgeMode?: EdgeMode }) {
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [edgeMode, setEdgeMode] = useState<EdgeMode>(initialEdgeMode ?? 'curved');
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);

  const selectNode = useCallback((id: string | null) => {
    setSelectedNodeIds(id ? [id] : []); setSelectedRegionId(null); setSelectedEdgeId(null);
  }, []);
  const selectNodes = useCallback((ids: string[]) => {
    setSelectedNodeIds(ids); setSelectedRegionId(null); setSelectedEdgeId(null);
  }, []);
  const selectRegion = useCallback((id: string | null) => {
    setSelectedRegionId(id); setSelectedNodeIds([]); setSelectedEdgeId(null);
  }, []);
  const selectEdge = useCallback((id: string | null) => {
    setSelectedEdgeId(id); setSelectedNodeIds([]); setSelectedRegionId(null);
  }, []);
  const clearSelection = useCallback(() => {
    setSelectedNodeIds([]); setSelectedRegionId(null); setSelectedEdgeId(null);
  }, []);
  const toggleEdgeMode = useCallback(() => setEdgeMode((m) => (m === 'curved' ? 'ortho' : 'curved')), []);

  const value: UIContextValue = {
    selectedId: selectedNodeIds.length === 1 ? selectedNodeIds[0] : null,
    selectedNodeIds, selectedRegionId, selectedEdgeId, edgeMode, clipboard,
    selectNode, selectNodes, selectRegion, selectEdge, clearSelection, toggleEdgeMode, setEdgeMode, setClipboard,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI(): UIContextValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUI must be used within a UIProvider');
  return c;
}
