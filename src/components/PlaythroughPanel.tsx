import { useGraph } from '../store/GraphContext';
import { usePlaythrough } from '../store/PlaythroughContext';
import { usePlaythroughCamera } from '../hooks/usePlaythroughCamera';
import { clampStep, resolveSteps } from '../lib/playthrough';
import { ProgressDots } from './ProgressDots';

/** Translucent step panel pinned to the right of the canvas while a playthrough
 *  runs: step counter, section title, hop line, step text, progress dots and
 *  Back / Next (Done) navigation. Lives in .canvas-wrap, outside the zoomed layer.
 *  Also hosts the camera-follow effect, since it is always mounted there. */
export function PlaythroughPanel() {
  usePlaythroughCamera();
  const { state } = useGraph();
  const { playing, stepIndex, stop, next, prev, goTo } = usePlaythrough();
  if (!playing) return null;
  const resolved = resolveSteps(state);
  if (!resolved.length) return null;

  const i = clampStep(stepIndex, resolved.length);
  const current = resolved[i];
  const previous = i > 0 ? resolved[i - 1] : null;
  const last = i === resolved.length - 1;

  return (
    <aside className="walk-panel" aria-label="Playthrough step">
      <div className="walk-eyebrow">STEP {i + 1} OF {resolved.length}</div>
      <div className="walk-title">{current.node.label}</div>
      {previous && <div className="walk-hop-line">{previous.node.label} → {current.node.label}</div>}
      <div className="walk-body">{current.step.text}</div>
      <ProgressDots count={resolved.length} active={i} onJump={goTo} />
      <div className="walk-actions">
        <button type="button" disabled={i === 0} onClick={prev}>← Back</button>
        <button type="button" className="primary" onClick={last ? stop : next}>
          {last ? 'Done' : 'Next →'}
        </button>
      </div>
      <div className="walk-hint">Esc exits · ← → step</div>
    </aside>
  );
}
