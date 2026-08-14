import { useUI } from '../store/UIContext';
import { useViewport } from '../store/ViewportContext';

/** Toolbar entry point for presentation mode: a read-only walkthrough view where node/region/
 *  edge pointer editing goes inert and the palette hides (pan/zoom/Fit keep working). Escape
 *  also exits (wired in ViewportContext, alongside the `presenting` state itself). Entering
 *  clears any selection so there's no lingering halo while presenting. */
export function PresentButton() {
  const { presenting, togglePresenting } = useViewport();
  const { clearSelection } = useUI();

  const handleClick = () => {
    if (!presenting) clearSelection();
    togglePresenting();
  };

  return (
    <button aria-pressed={presenting} className={presenting ? 'active' : undefined} onClick={handleClick}>
      ▶ Present
    </button>
  );
}
