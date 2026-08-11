import { ui, nodes } from './state';
import { updateEdges } from './edges';
import { createRegion } from './regions';
import { loadTemplate, clearAll } from './templates';
import { exportGraph, importGraph } from './io';

/** Keep the edge-style button caption in sync with ui.edgeMode. */
export function updateEdgeStyleLabel(): void {
  const btn = document.getElementById('btn-edgestyle')!;
  btn.textContent = 'Edges: ' + (ui.edgeMode === 'curved' ? 'Curved' : 'Orthogonal');
}

export function initToolbar(): void {
  document.getElementById('btn-region')!.onclick = () =>
    createRegion({ x: 60 + Math.random() * 40, y: 60 + Math.random() * 40 });

  document.getElementById('btn-edgestyle')!.onclick = () => {
    ui.edgeMode = ui.edgeMode === 'curved' ? 'ortho' : 'curved';
    updateEdgeStyleLabel();
    updateEdges();
  };

  const tpl = document.getElementById('tpl-select') as HTMLSelectElement;
  tpl.onchange = () => {
    const v = tpl.value;
    if (v) {
      if (Object.keys(nodes).length && !confirm('Replace the current canvas with this template?')) {
        tpl.value = '';
        return;
      }
      loadTemplate(v);
    }
    tpl.value = '';
  };

  document.getElementById('btn-export')!.onclick = exportGraph;
  document.getElementById('btn-import')!.onclick = () =>
    (document.getElementById('file-input') as HTMLInputElement).click();

  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  fileInput.onchange = () => {
    const f = fileInput.files?.[0];
    if (f) importGraph(f);
    fileInput.value = '';
  };

  document.getElementById('btn-clear')!.onclick = () => {
    if (confirm('Clear the whole canvas?')) clearAll();
  };
}
