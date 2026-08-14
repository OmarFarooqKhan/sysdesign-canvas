import { useRef, useState } from 'react';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { parse } from '../lib/io';
import { AlertDialog } from './AlertDialog';

/** Toolbar entry point for importing a diagram from a JSON file: hidden file input +
 *  its trigger button, plus an AlertDialog for malformed files. Split out of Toolbar.tsx
 *  for the line cap, mirroring LibraryButton/ShareButton. */
export function ImportButton({ disabled }: { disabled?: boolean }) {
  const { dispatch } = useGraph();
  const { setEdgeMode } = useUI();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        const d = parse(text);
        dispatch({ type: 'LOAD', data: d });
        setEdgeMode(d.edgeMode);
      } catch (err) {
        setAlertMsg('Could not import: ' + (err as Error).message);
      }
    }
    e.target.value = '';
  };

  return (
    <>
      <button disabled={disabled} title="Import a diagram from a JSON file" onClick={() => fileInputRef.current?.click()}>
        Import
      </button>
      <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleFileChange} />
      {alertMsg && <AlertDialog message={alertMsg} onClose={() => setAlertMsg(null)} />}
    </>
  );
}
