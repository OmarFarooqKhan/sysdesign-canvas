import { useGraph } from '../store/GraphContext';
import { useUI } from '../store/UIContext';
import { usePlaythrough } from '../store/PlaythroughContext';
import { DOT_COLOR, clampStep, hopForStep, parkPoint, resolveSteps } from '../lib/playthrough';

/** Bright center layered over the DOT_COLOR fills. */
const CORE_COLOR = '#d8ffd0';

/** Concentric neon circles: soft glow, pulsing halo, solid body, bright core. */
function DotShape() {
  return (
    <>
      <circle r={10} fill={DOT_COLOR} opacity={0.12} />
      <circle className="walk-halo" r={7} fill={DOT_COLOR} opacity={0.3} />
      <circle r={4.5} fill={DOT_COLOR} />
      <circle r={2} fill={CORE_COLOR} />
    </>
  );
}

function StaticDot({ at }: { at: { x: number; y: number } }) {
  return (
    <svg className="walk-dot" aria-hidden="true">
      <g transform={`translate(${at.x} ${at.y})`}>
        <DotShape />
      </g>
    </svg>
  );
}

/** The animated "request" dot. Lives inside .canvas-inner so it pans/zooms with
 *  content. Step 0 parks it on the first node's border; later steps loop it along
 *  the hop path with SMIL. A reversed hop replays the drawn path backwards via
 *  keyPoints — never a rebuilt mirrored path (bends would flip). Under reduced
 *  motion the dot sits statically at the hop's midpoint instead. */
export function PlaythroughDot() {
  const { state } = useGraph();
  const { edgeMode } = useUI();
  const { playing, stepIndex } = usePlaythrough();
  if (!playing) return null;
  const resolved = resolveSteps(state);
  if (!resolved.length) return null;
  const hop = hopForStep(state, edgeMode, resolved, clampStep(stepIndex, resolved.length));
  if (!hop) return <StaticDot at={parkPoint(resolved)} />;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return <StaticDot at={hop.mid} />;
  return (
    <svg className="walk-dot" aria-hidden="true">
      <g>
        <DotShape />
        <animateMotion
          dur="1.8s"
          repeatCount="indefinite"
          path={hop.d}
          {...(hop.reverse ? { keyPoints: '1;0', keyTimes: '0;1', calcMode: 'linear' } : {})}
        />
      </g>
    </svg>
  );
}
