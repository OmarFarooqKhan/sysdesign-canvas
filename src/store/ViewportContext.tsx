import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { clampZoom, stepZoom } from '../lib/viewport';
import type { Viewport } from '../lib/viewport';

/** Non-undoable, non-serialized camera state: zoom/pan + the pan-tool toggle. */
export interface ViewportContextValue extends Viewport {
  panMode: boolean;
  /** Read-only walkthrough mode: editing is inert, palette hidden; pan/zoom/Fit still work. */
  presenting: boolean;
  /** The canvas's root element, so consumers can compute screen->canvas conversions. */
  canvasRef: RefObject<HTMLDivElement | null>;
  zoomIn: () => void;
  zoomOut: () => void;
  setViewport: (v: Partial<Viewport>) => void;
  panBy: (dx: number, dy: number) => void;
  togglePanMode: () => void;
  togglePresenting: () => void;
}

const Ctx = createContext<ViewportContextValue | null>(null);

export function ViewportProvider({ children }: { children: ReactNode }) {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [panMode, setPanMode] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const zoomIn = useCallback(() => setZoom((z) => stepZoom(z, 1)), []);
  const zoomOut = useCallback(() => setZoom((z) => stepZoom(z, -1)), []);
  const setViewport = useCallback((v: Partial<Viewport>) => {
    if (v.zoom !== undefined) setZoom(clampZoom(v.zoom));
    if (v.panX !== undefined) setPanX(v.panX);
    if (v.panY !== undefined) setPanY(v.panY);
  }, []);
  const panBy = useCallback((dx: number, dy: number) => {
    setPanX((x) => x + dx);
    setPanY((y) => y + dy);
  }, []);
  const togglePanMode = useCallback(() => setPanMode((m) => !m), []);
  const togglePresenting = useCallback(() => setPresenting((p) => !p), []);

  // Escape exits presentation mode; only listens while presenting is active.
  useEffect(() => {
    if (!presenting) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPresenting(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [presenting]);

  const value: ViewportContextValue = {
    zoom, panX, panY, panMode, presenting, canvasRef,
    zoomIn, zoomOut, setViewport, panBy, togglePanMode, togglePresenting,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useViewport(): ViewportContextValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('useViewport must be used within a ViewportProvider');
  return c;
}
