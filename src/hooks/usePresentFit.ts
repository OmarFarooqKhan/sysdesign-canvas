import { useEffect, useRef } from 'react';
import { useGraph } from '../store/GraphContext';
import { useViewport } from '../store/ViewportContext';
import { usePlaythrough } from '../store/PlaythroughContext';
import { fitContent } from '../lib/viewport';

/** Fits the whole diagram to the full canvas (no panel inset) when Present is clicked
 *  and no playthrough starts alongside it — the rising edge of `presenting` while a
 *  playthrough isn't playing. When a playthrough does start in the same click,
 *  usePlaythroughCamera's own entry fit owns the camera instead, so this hook must never
 *  stomp it: `playing` is read from a live ref rather than made a reactive dependency,
 *  otherwise the effect would re-fire (and re-fit) when a Present-started playthrough
 *  later stops, undoing the camera hook's just-restored viewport. */
export function usePresentFit(): void {
  const { state } = useGraph();
  const { playing } = usePlaythrough();
  const { presenting, setViewport, canvasRef } = useViewport();

  const prevPresenting = useRef(false);
  const live = useRef({ state, playing });
  live.current = { state, playing };

  useEffect(() => {
    const wasPresenting = prevPresenting.current;
    prevPresenting.current = presenting;
    if (!presenting || wasPresenting || live.current.playing) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const fit = fitContent(live.current.state, rect.width, rect.height);
    if (fit) setViewport(fit);
  }, [presenting]);
}
