import { GraphProvider } from './store/GraphContext';
import { UIProvider } from './store/UIContext';
import { Toolbar } from './components/Toolbar';
import { Palette } from './components/Palette';
import { Canvas } from './components/Canvas';

export function App() {
  return (
    <GraphProvider>
      <UIProvider>
        <div className="app">
          <Toolbar />
          <div className="layout">
            <Palette />
            <div className="canvas-wrap">
              <Canvas />
            </div>
          </div>
        </div>
      </UIProvider>
    </GraphProvider>
  );
}
