import { useRef } from 'react';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { useViewport } from '../store/ViewportContext';
import { contentBounds, fitTransform } from '../lib/viewport';
import { TEMPLATE_OPTIONS, templateToData } from '../data/templates';
import type { TemplateKey } from '../data/templates';
import { toData, download, parse } from '../lib/io';

/** Top header bar: templates, region/edge tools, undo/redo, import/export, clear. */
export function Toolbar() {
  const { state, dispatch, canUndo, canRedo } = useGraph();
  const { edgeMode, toggleEdgeMode, setEdgeMode } = useUI();
  const { panMode, togglePanMode, setViewport, canvasRef } = useViewport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFit = () => {
    const bounds = contentBounds(state);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!bounds || !rect) return;
    setViewport(fitTransform(bounds, rect.width, rect.height));
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value as TemplateKey | '';
    if (key) {
      const hasNodes = Object.keys(state.nodes).length > 0;
      if (!hasNodes || confirm('Replace the current canvas with this template?')) {
        dispatch({ type: 'LOAD', data: templateToData(key) });
        setEdgeMode('curved');
      }
    }
    e.target.value = '';
  };

  const handleAddRegion = () => {
    dispatch({ type: 'ADD_REGION', region: { x: 60 + Math.random() * 40, y: 60 + Math.random() * 40 } });
  };

  const handleExport = () => download(toData(state, edgeMode));

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        const d = parse(text);
        dispatch({ type: 'LOAD', data: d });
        setEdgeMode(d.edgeMode);
      } catch (err) {
        alert('Could not import: ' + (err as Error).message);
      }
    }
    e.target.value = '';
  };

  const handleClear = () => {
    if (confirm('Clear the whole canvas?')) dispatch({ type: 'CLEAR' });
  };

  return (
    <header>
      <h1>🧩 System Design Canvas</h1>
      <span className="hint">Drag from the palette · click to connect</span>
      <div className="spacer" />
      <select defaultValue="" onChange={handleTemplateChange} aria-label="Templates">
        <option value="">Templates…</option>
        {TEMPLATE_OPTIONS.map((t) => (
          <option key={t.key} value={t.key}>{t.label}</option>
        ))}
      </select>
      <button onClick={handleAddRegion}>+ Region</button>
      <button onClick={toggleEdgeMode}>Edges: {edgeMode === 'curved' ? 'Curved' : 'Orthogonal'}</button>
      <button onClick={handleFit}>⤢ Fit</button>
      <button
        aria-pressed={panMode}
        className={panMode ? 'active' : undefined}
        onClick={togglePanMode}
      >
        ✋ Pan
      </button>
      <button disabled={!canUndo} onClick={() => dispatch({ type: 'UNDO' })}>Undo</button>
      <button disabled={!canRedo} onClick={() => dispatch({ type: 'REDO' })}>Redo</button>
      <button onClick={handleExport}>Export JSON</button>
      <button onClick={handleImportClick}>Import</button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button className="danger" onClick={handleClear}>Clear</button>
    </header>
  );
}
