import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/** Modal replacement for window.confirm(). Escape/backdrop/Cancel dismiss without confirming;
 *  OK runs onConfirm. Portaled onto document.body for the same reason as AlertDialog. */
export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return createPortal(
    <div className="alert-backdrop" onMouseDown={onCancel}>
      <div className="alert-modal" role="alertdialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <div className="alert-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" className="primary" onClick={onConfirm}>OK</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
