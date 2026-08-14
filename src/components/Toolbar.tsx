import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { useViewport } from '../store/ViewportContext';
import { contentBounds, fitTransform } from '../lib/viewport';
import { toData, download } from '../lib/io';
import { exportPng } from '../lib/exportPng';
import { downloadSvg } from '../lib/exportSvg';
import { ConfirmDialog } from './ConfirmDialog';
import { useConfirmAction } from '../hooks/useConfirmAction';
import { LibraryButton } from './LibraryButton';
import { ShareButton } from './ShareButton';
import { ImportButton } from './ImportButton';
import { PresentButton } from './PresentButton';
import { PlaythroughButton } from './PlaythroughButton';
import { TemplateSelect } from './TemplateSelect';

/** Top header bar, organized into scannable groups: start a diagram, build it, adjust the
 *  view, present it, share it out, and (set apart) clear it. Editing controls disable while
 *  presenting; Fit/Pan/Present/Export/Share stay live since they don't mutate the diagram. */
export function Toolbar() {
  const { state, dispatch } = useGraph();
  const { edgeMode, toggleEdgeMode } = useUI();
  const { panMode, togglePanMode, setViewport, canvasRef, presenting } = useViewport();
  const { pending, request, resolve, cancel } = useConfirmAction();

  const handleFit = () => {
    const bounds = contentBounds(state);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!bounds || !rect) return;
    setViewport(fitTransform(bounds, rect.width, rect.height));
  };

  const handleExportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'json') download(toData(state, edgeMode));
    else if (e.target.value === 'png') exportPng(state, canvasRef.current);
    else if (e.target.value === 'svg') downloadSvg(state, edgeMode);
    e.target.value = '';
  };

  return (
    <header>
      {pending && <ConfirmDialog message={pending.message} onConfirm={resolve} onCancel={cancel} />}
      <h1>🧩 System Design Canvas</h1>
      <span className="hint">Drag from the palette · click to connect</span>
      <div className="spacer" />

      {/* Start a diagram: built-in template, saved diagram, or a JSON file. */}
      <div className="toolbar-group">
        <TemplateSelect disabled={presenting} request={request} />
        <LibraryButton disabled={presenting} />
        <ImportButton disabled={presenting} />
      </div>

      {/* Build: add to and configure the current diagram. */}
      <div className="toolbar-group">
        <button disabled={presenting} title="Add a region to group nodes" onClick={() => dispatch({ type: 'ADD_REGION', region: { x: 60 + Math.random() * 40, y: 60 + Math.random() * 40 } })}>+ Region</button>
        <button aria-pressed={edgeMode === 'ortho'} className={edgeMode === 'ortho' ? 'active' : undefined} disabled={presenting} title="Switch how edges are routed" onClick={toggleEdgeMode}>Edges: {edgeMode === 'curved' ? 'Curved' : 'Orthogonal'}</button>
      </div>

      {/* View: adjust the viewport, not the diagram data. */}
      <div className="toolbar-group">
        <button title="Fit the diagram to the view" onClick={handleFit}>⤢ Fit</button>
        <button aria-pressed={panMode} className={panMode ? 'active' : undefined} title="Toggle pan mode" onClick={togglePanMode}>✋ Pan</button>
      </div>

      {/* Present: read-only walkthrough modes. */}
      <div className="toolbar-group">
        <PresentButton />
        <PlaythroughButton />
      </div>

      {/* Share the diagram out: a link, or a file. */}
      <div className="toolbar-group">
        <ShareButton />
        <select defaultValue="" onChange={handleExportChange} aria-label="Export">
          <option value="">Export…</option>
          <option value="json">as JSON</option>
          <option value="png">as PNG</option>
          <option value="svg">as SVG</option>
        </select>
      </div>

      <button className="group-start danger" disabled={presenting} onClick={() => request('Clear the whole canvas?', () => dispatch({ type: 'CLEAR' }))}>Clear</button>
    </header>
  );
}
