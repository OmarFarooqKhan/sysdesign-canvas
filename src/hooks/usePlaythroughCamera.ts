import { useEffect, useRef } from 'react';
import { useGraph } from '../store/GraphContext';
import { useViewport } from '../store/ViewportContext';
import { usePlaythrough } from '../store/PlaythroughContext';
import { nodeCenter } from '../lib/geometry';
import { PANEL_W, clampStep, panToStep, resolveSteps } from '../lib/playthrough';
import type { Viewport } from '../lib/viewport';

/** The panel's 14px inset on both sides, added to PANEL_W for the viewport area
 *  reserved on the right while playing. */
const PANEL_MARGINS = 28;

/** Camera follow for the playthrough: entering remembers the viewport, every step
 *  change pans the active node into the visible area left of the panel (zoom is
 *  left alone), and exiting restores the remembered pre-playthrough viewport.
 *  Smoothness is CSS (.app.playing .canvas-inner transition). */
export function usePlaythroughCamera(): void {
  const { state } = useGraph();
  const { playing, stepIndex } = usePlaythrough();
  const { zoom, panX, panY, setViewport, canvasRef } = useViewport();

  // Refs, not deps: panning reads the live values but must run only on
  // playing/step changes, not on every viewport or graph change.
  const saved = useRef<Viewport | null>(null);
  const live = useRef({ state, zoom, panX, panY });
  live.current = { state, zoom, panX, panY };

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
    if (!playing) return;
    const { state, zoom, panX, panY } = live.current;
    const resolved = resolveSteps(state);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!resolved.length || !rect) return;
    const node = resolved[clampStep(stepIndex, resolved.length)].node;
    setViewport(panToStep({ zoom, panX, panY }, rect.width, rect.height, nodeCenter(node), PANEL_W + PANEL_MARGINS));
  }, [playing, stepIndex, canvasRef, setViewport]);
}
