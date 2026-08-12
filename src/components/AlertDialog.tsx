import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/** Modal replacement for window.alert(). Escape or OK dismisses it. Portaled onto document.body
 *  for the same stacking-context reasons documented in DbInspector.tsx. */
export function AlertDialog({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="alert-backdrop" onMouseDown={onClose}>
      <div className="alert-modal" role="alertdialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <div className="alert-actions">
          <button type="button" className="primary" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
