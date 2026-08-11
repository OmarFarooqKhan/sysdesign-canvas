import type { Region } from './types';
import { selectRegion, deleteRegion } from './regions';

/** Attach move (via title bar), resize (via corner), and rename behaviour. */
export function wireRegion(reg: Region): void {
  const el = reg.el;
  const title = el.querySelector('.r-title') as HTMLElement;
  const resize = el.querySelector('.r-resize') as HTMLElement;
  const del = el.querySelector('.r-del') as HTMLElement;

  el.addEventListener('mousedown', (e) => { if (e.target === el) selectRegion(reg.id); });

  title.addEventListener('mousedown', (e) => {
    if (title.isContentEditable) return;
    e.preventDefault();
    e.stopPropagation();
    selectRegion(reg.id);
    const sx = e.clientX, sy = e.clientY, ox = reg.x, oy = reg.y;
    const move = (ev: MouseEvent) => {
      reg.x = Math.max(0, ox + ev.clientX - sx);
      reg.y = Math.max(0, oy + ev.clientY - sy);
      el.style.left = reg.x + 'px';
      el.style.top = reg.y + 'px';
    };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });

  resize.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, ow = reg.w, oh = reg.h;
    const move = (ev: MouseEvent) => {
      reg.w = Math.max(120, ow + ev.clientX - sx);
      reg.h = Math.max(90, oh + ev.clientY - sy);
      el.style.width = reg.w + 'px';
      el.style.height = reg.h + 'px';
    };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });

  title.addEventListener('dblclick', () => {
    title.contentEditable = 'true';
    title.focus();
    getSelection()?.selectAllChildren(title);
  });
  title.addEventListener('blur', () => {
    title.contentEditable = 'false';
    reg.title = (title.textContent || '').trim() || reg.title;
    title.textContent = reg.title;
  });
  title.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); title.blur(); }
  });

  del.addEventListener('click', (e) => { e.stopPropagation(); deleteRegion(reg); });
}
