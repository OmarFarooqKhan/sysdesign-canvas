import { useState } from 'react';
import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { toData } from '../lib/io';
import { encodeShare } from '../lib/shareUrl';
import { AlertDialog } from './AlertDialog';

/** Toolbar entry point for sharing: copies a link to the clipboard and confirms via AlertDialog. */
export function ShareButton() {
  const { state } = useGraph();
  const { edgeMode } = useUI();
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleShare = async () => {
    await navigator.clipboard.writeText(encodeShare(toData(state, edgeMode)));
    setAlertMsg('Share link copied to clipboard.');
  };

  return (
    <>
      <button onClick={handleShare}>🔗 Share</button>
      {alertMsg && <AlertDialog message={alertMsg} onClose={() => setAlertMsg(null)} />}
    </>
  );
}
