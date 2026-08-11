import './style.css';
import { buildPalette, initDrop } from './palette';
import { initToolbar } from './toolbar';
import { canvas, svg, regions, ui } from './state';
import { selectNode, deleteNode } from './nodes';
import { deleteRegion } from './regions';
import { closeCtx, isCtx } from './contextmenu';

buildPalette();
initDrop();
initToolbar();

// Close the context menu on any outside click.
document.addEventListener('click', (e) => {
  if (!isCtx(e.target)) closeCtx();
});

// Clicking empty canvas clears all selection.
canvas.addEventListener('mousedown', (e) => {
  if (e.target === canvas || e.target === svg) {
    selectNode(null);
    regions.forEach((r) => r.el.classList.remove('selected'));
    ui.selectedRegion = null;
  }
});

// Delete / Backspace removes the selected node or region (never while editing text).
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Delete' && e.key !== 'Backspace') return;
  if ((document.activeElement as HTMLElement | null)?.isContentEditable) return;
  if (ui.selected) {
    deleteNode(ui.selected);
  } else if (ui.selectedRegion) {
    const r = regions.find((rg) => rg.id === ui.selectedRegion);
    if (r) deleteRegion(r);
  }
});
