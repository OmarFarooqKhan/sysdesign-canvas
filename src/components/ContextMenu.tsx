import { useEffect } from 'react';

export interface MenuItem {
  label: string;
  danger?: boolean;
  onClick: () => void;
}

/** Floating menu at (x, y); closes on any outside click. */
export function ContextMenu({ x, y, items, onClose }: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  useEffect(() => {
    const close = () => onClose();
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [onClose]);

  return (
    <div className="ctx" style={{ left: x, top: y }} onClick={(e) => e.stopPropagation()}>
      {items.map((it, i) => (
        <button
          key={i}
          className={it.danger ? 'danger' : undefined}
          onClick={() => { it.onClick(); onClose(); }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
