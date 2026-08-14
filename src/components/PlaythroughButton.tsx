import { useGraph } from '../store/GraphContext';
import { usePlaythrough } from '../store/PlaythroughContext';
import { resolveSteps } from '../lib/playthrough';

/** Toolbar toggle for guided playthrough mode, mirroring PresentButton. Disabled
 *  until at least one authored step resolves to a live node; entering clears the
 *  selection (inside start()) and Escape exits (wired in PlaythroughContext). */
export function PlaythroughButton() {
  const { state } = useGraph();
  const { playing, start, stop } = usePlaythrough();
  const disabled = resolveSteps(state).length === 0;

  return (
    <button
      aria-pressed={playing}
      className={playing ? 'active' : undefined}
      disabled={disabled}
      title={disabled ? 'Add steps first: right-click a node → Playthrough step…' : undefined}
      onClick={playing ? stop : start}
    >
      ▶ Playthrough
    </button>
  );
}
