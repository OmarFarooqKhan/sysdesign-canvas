import { GraphProvider } from './store/GraphContext';
import { UIProvider } from './store/UIContext';
import { ViewportProvider } from './store/ViewportContext';
import { Toolbar } from './components/Toolbar';
import { Palette } from './components/Palette';
import { Canvas } from './components/Canvas';

export function App() {
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
