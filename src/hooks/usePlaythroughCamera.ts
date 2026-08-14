import { useEffect, useRef } from 'react';
import { useGraph } from '../store/GraphContext';
import { useViewport } from '../store/ViewportContext';
import { usePlaythrough } from '../store/PlaythroughContext';
import { nodeCenter } from '../lib/geometry';
import { PANEL_W, clampStep, panToStep, resolveSteps } from '../lib/playthrough';
import { fitContent, nodeVisible } from '../lib/viewport';
import type { Viewport } from '../lib/viewport';

/** The panel's 14px inset on both sides, added to PANEL_W for the viewport area
 *  reserved on the right while playing. */
const PANEL_MARGINS = 28;

/** Camera follow for the playthrough: entering remembers the viewport, then fits the
 *  whole diagram into the area left of the panel (panning into view too, if the fit
 *  still leaves the active node hidden on an oversized diagram). After that, a step
 *  change only pans when the new active node isn't fully visible — otherwise the
 *  camera holds the fit framing. Exiting restores the remembered pre-playthrough
 *  viewport. Smoothness is CSS (.app.playing .canvas-inner transition). */
export function usePlaythroughCamera(): void {
  const { state } = useGraph();
  const { playing, stepIndex } = usePlaythrough();
  const { zoom, panX, panY, setViewport, canvasRef } = useViewport();

  // Refs, not deps: panning reads the live values but must run only on
  // playing/step changes, not on every viewport or graph change.
  const saved = useRef<Viewport | null>(null);
  const live = useRef({ state, zoom, panX, panY });
  live.current = { state, zoom, panX, panY };

  // Whether the entry fit has already run for the current playing session.
  const entered = useRef(false);

  useEffect(() => {
    if (playing) {
      const { zoom, panX, panY } = live.current;
      saved.current = { zoom, panX, panY };
      return;
    }
    if (saved.current) {
      setViewport(saved.current);
      saved.current = null;
    }
  }, [playing, setViewport]);

  useEffect(() => {
    if (!playing) { entered.current = false; return; }
    const { state } = live.current;
    const resolved = resolveSteps(state);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!resolved.length || !rect) return;
    const node = resolved[clampStep(stepIndex, resolved.length)].node;
    const inset = PANEL_W + PANEL_MARGINS;
    const center = nodeCenter(node);

    if (!entered.current) {
      entered.current = true;
      // Non-null: `resolved.length` above guarantees state.nodes has at least one
      // entry, so contentBounds — and therefore fitContent — can never be null here.
      const fit = fitContent(state, rect.width, rect.height, inset)!;
      setViewport(fit);
      if (!nodeVisible(fit, rect.width, rect.height, node, inset)) {
        setViewport(panToStep(fit, rect.width, rect.height, center, inset));
      }
      return;
    }

    const { zoom, panX, panY } = live.current;
    const vp = { zoom, panX, panY };
    if (!nodeVisible(vp, rect.width, rect.height, node, inset)) {
      setViewport(panToStep(vp, rect.width, rect.height, center, inset));
    }
  }, [playing, stepIndex, canvasRef, setViewport]);
}
