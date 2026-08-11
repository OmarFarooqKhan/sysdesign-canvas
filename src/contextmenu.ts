interface MenuItem {
  label: string;
  danger?: boolean;
  onClick: () => void;
}

let ctxEl: HTMLElement | null = null;

export function closeCtx(): void {
  if (ctxEl) {
    ctxEl.remove();
    ctxEl = null;
  }
}

/** True when the given event target lives inside the open menu. */
export function isCtx(target: EventTarget | null): boolean {
  return !!ctxEl && ctxEl.contains(target as Node);
}

/** Render a small floating menu at (x, y). Each item closes it on click. */
export function openMenu(x: number, y: number, items: MenuItem[]): void {
  closeCtx();
  const m = document.createElement('div');
  m.className = 'ctx';
  m.style.left = x + 'px';
  m.style.top = y + 'px';
  items.forEach((it) => {
    const b = document.createElement('button');
    if (it.danger) b.className = 'danger';
    b.textContent = it.label;
    b.onclick = () => {
      closeCtx();
      it.onClick();
    };
    m.appendChild(b);
  });
  document.body.appendChild(m);
  ctxEl = m;
}
