import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { useViewport } from '../store/ViewportContext';
import { usePlaythrough } from '../store/PlaythroughContext';
import { resolveSteps } from '../lib/playthrough';

/** Toolbar entry point for presentation mode: a read-only walkthrough view where node/region/
 *  edge pointer editing goes inert and the palette hides (pan/zoom/Fit keep working). Escape
 *  also exits (wired in ViewportContext, alongside the `presenting` state itself). Entering
 *  clears any selection so there's no lingering halo while presenting, and auto-starts the
 *  guided playthrough when steps are authored (unless one is already running, so a mid-tour
 *  Present click doesn't reset the current step). Exiting stops a running playthrough too. */
export function PresentButton() {
  const { state } = useGraph();
  const { presenting, togglePresenting } = useViewport();
  const { clearSelection } = useUI();
  const { playing, start, stop } = usePlaythrough();

  const handleClick = () => {
    if (!presenting) {
      clearSelection();
      if (!playing && resolveSteps(state).length > 0) start();
    } else if (playing) {
      stop();
    }
    togglePresenting();
  };

  return (
    <button aria-pressed={presenting} className={presenting ? 'active' : undefined} onClick={handleClick}>
      ▶ Present
    </button>
  );
}
