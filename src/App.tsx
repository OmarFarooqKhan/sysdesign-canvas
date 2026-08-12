import { GraphProvider } from './store/GraphContext';
import { UIProvider } from './store/UIContext';
import { ViewportProvider } from './store/ViewportContext';
import { Toolbar } from './components/Toolbar';
import { Palette } from './components/Palette';
import { Canvas } from './components/Canvas';
import { useAutoHideScrollbars } from './hooks/useAutoHideScrollbars';

export function App() {
  useAutoHideScrollbars();
  return (
    <GraphProvider>
      <UIProvider>
        <ViewportProvider>
          <div className="app">
            <Toolbar />
            <div className="layout">
              <Palette />
              <div className="canvas-wrap">
                <Canvas />
              </div>
            </div>
          </div>
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>
  );
}
