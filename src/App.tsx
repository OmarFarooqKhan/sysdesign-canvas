import { GraphProvider } from './store/GraphContext';
import { UIProvider } from './store/UIContext';

// Foundation skeleton. Task D replaces the header/layout slots with the
// Toolbar, Palette, and Canvas components once they exist.
export function App() {
  return (
    <GraphProvider>
      <UIProvider>
        <div className="app">
          <header>
            <h1>🧩 System Design Canvas</h1>
          </header>
          <div className="layout" />
        </div>
      </UIProvider>
    </GraphProvider>
  );
}
