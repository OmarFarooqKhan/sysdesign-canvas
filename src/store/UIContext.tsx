import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { EdgeMode } from '../types';

export interface UIContextValue {
  selectedId: string | null;
  selectedRegionId: string | null;
  edgeMode: EdgeMode;
  selectNode: (id: string | null) => void;
  selectRegion: (id: string | null) => void;
  clearSelection: () => void;
  toggleEdgeMode: () => void;
  setEdgeMode: (m: EdgeMode) => void;
}

const Ctx = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [edgeMode, setEdgeMode] = useState<EdgeMode>('curved');

  const selectNode = useCallback((id: string | null) => { setSelectedId(id); setSelectedRegionId(null); }, []);
  const selectRegion = useCallback((id: string | null) => { setSelectedRegionId(id); setSelectedId(null); }, []);
  const clearSelection = useCallback(() => { setSelectedId(null); setSelectedRegionId(null); }, []);
  const toggleEdgeMode = useCallback(() => setEdgeMode((m) => (m === 'curved' ? 'ortho' : 'curved')), []);

  const value: UIContextValue = {
    selectedId, selectedRegionId, edgeMode,
    selectNode, selectRegion, clearSelection, toggleEdgeMode, setEdgeMode,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI(): UIContextValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUI must be used within a UIProvider');
  return c;
}
