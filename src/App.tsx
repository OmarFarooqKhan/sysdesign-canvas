import { useEffect, useState } from 'react';
import { GraphProvider, useGraph } from './store/GraphContext';
import { UIProvider, useUI } from './store/UIContext';
import { ViewportProvider, useViewport } from './store/ViewportContext';
import { PlaythroughProvider, usePlaythrough } from './store/PlaythroughContext';
import { Toolbar } from './components/Toolbar';
import { Palette } from './components/Palette';
import { Canvas } from './components/Canvas';
import { PlaythroughPanel } from './components/PlaythroughPanel';
import { useAutoHideScrollbars } from './hooks/useAutoHideScrollbars';
import { useAutosave } from './hooks/useAutosave';
import { fromData } from './store/actions';
import { loadLocal } from './lib/persist';
import { decodeShare } from './lib/shareUrl';
import type { EdgeMode, GraphState } from './types';

interface Startup { state?: GraphState; edgeMode?: EdgeMode; fromShare: boolean }

/** Startup precedence: a share link (if present in the URL hash) beats the local autosave,
 *  which beats an empty canvas. */
function resolveStartup(): Startup {
  const shared = decodeShare(window.location.hash);
  if (shared) return { state: fromData(shared), edgeMode: shared.edgeMode, fromShare: true };
  const saved = loadLocal();
  if (saved) return { state: fromData(saved), edgeMode: saved.edgeMode, fromShare: false };
  return { fromShare: false };
}

/** Wires the debounced autosave to live graph state, invisibly. */
function Autosave() {
  const { state } = useGraph();
  const { edgeMode } = useUI();
  useAutosave(state, edgeMode);
  return null;
}

/** The app shell: carries the `presenting` class (drives the CSS that makes node/region/edge
 *  pointer editing inert while presenting) and hides the palette while presenting. A running
 *  playthrough applies the same inertness (plus its own `playing` class for dim/pan CSS)
 *  without touching the user's separate `presenting` toggle. */
function Shell() {
  const { presenting } = useViewport();
  const { playing } = usePlaythrough();
  const inert = presenting || playing;
  const cls = ['app', inert && 'presenting', playing && 'playing'].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <Autosave />
      <Toolbar />
      <div className="layout">
        <Palette presenting={inert} />
        <div className="canvas-wrap">
          <Canvas />
          <PlaythroughPanel />
        </div>
      </div>
    </div>
  );
}

export function App() {
  useAutoHideScrollbars();
  const [startup] = useState(resolveStartup);

  useEffect(() => {
    if (startup.fromShare) history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [startup.fromShare]);

  return (
    <GraphProvider initial={startup.state}>
      <UIProvider initialEdgeMode={startup.edgeMode}>
        <ViewportProvider>
          <PlaythroughProvider>
            <Shell />
          </PlaythroughProvider>
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>
  );
}
