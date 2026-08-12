import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { EdgeMode } from '../types';

export interface UIContextValue {
  selectedId: string | null;
  selectedRegionId: string | null;
  selectedEdgeId: string | null;
  edgeMode: EdgeMode;
  selectNode: (id: string | null) => void;
  selectRegion: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  clearSelection: () => void;
  toggleEdgeMode: () => void;
  setEdgeMode: (m: EdgeMode) => void;
}

const Ctx = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [edgeMode, setEdgeMode] = useState<EdgeMode>('curved');

  const selectNode = useCallback((id: string | null) => {
    setSelectedId(id); setSelectedRegionId(null); setSelectedEdgeId(null);
  }, []);
  const selectRegion = useCallback((id: string | null) => {
    setSelectedRegionId(id); setSelectedId(null); setSelectedEdgeId(null);
  }, []);
  const selectEdge = useCallback((id: string | null) => {
    setSelectedEdgeId(id); setSelectedId(null); setSelectedRegionId(null);
  }, []);
  const clearSelection = useCallback(() => {
    setSelectedId(null); setSelectedRegionId(null); setSelectedEdgeId(null);
  }, []);
  const toggleEdgeMode = useCallback(() => setEdgeMode((m) => (m === 'curved' ? 'ortho' : 'curved')), []);

  const value: UIContextValue = {
    selectedId, selectedRegionId, selectedEdgeId, edgeMode,
    selectNode, selectRegion, selectEdge, clearSelection, toggleEdgeMode, setEdgeMode,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI(): UIContextValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUI must be used within a UIProvider');
  return c;
}
