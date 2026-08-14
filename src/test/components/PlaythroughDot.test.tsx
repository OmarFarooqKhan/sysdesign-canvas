import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphProvider } from '../../store/GraphContext';
import { UIProvider, useUI } from '../../store/UIContext';
import { ViewportProvider } from '../../store/ViewportContext';
import { PlaythroughProvider, usePlaythrough } from '../../store/PlaythroughContext';
import { PlaythroughDot } from '../../components/PlaythroughDot';
import { DOT_COLOR, hopForStep, parkPoint, resolveSteps } from '../../lib/playthrough';
import type { Edge, GraphState, WalkStep } from '../../types';

const steps: WalkStep[] = [{ nodeId: 'n1', text: 'a' }, { nodeId: 'n2', text: 'b' }];

const seed = (edges: Edge[] = [], walkthrough: WalkStep[] = steps): GraphState => ({
  nodes: {
    n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 100, y: 100 },
    n2: { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 300, y: 100 },
  },
  edges,
  regions: [],
  seq: 2,
  walkthrough,
});

/** jsdom has no matchMedia; install a minimal stub reporting the given preference. */
function setReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) => ({ matches, media: query })) as unknown as typeof window.matchMedia;
}

function Controls() {
  const { start, next } = usePlaythrough();
  const { setEdgeMode } = useUI();
  return (
    <>
      <button onClick={start}>start</button>
      <button onClick={next}>next</button>
      <button onClick={() => setEdgeMode('ortho')}>ortho</button>
    </>
  );
}

function setup(initial: GraphState) {
  return render(
    <GraphProvider initial={initial}>
      <UIProvider>
        <ViewportProvider>
          <PlaythroughProvider>
            <Controls />
            <PlaythroughDot />
          </PlaythroughProvider>
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>,
  );
}

const play = () => fireEvent.click(screen.getByText('start'));
const advance = () => fireEvent.click(screen.getByText('next'));
const dot = () => document.querySelector('svg.walk-dot');
const motion = () => document.querySelector('svg.walk-dot animateMotion');

beforeEach(() => setReducedMotion(false));
afterEach(() => {
  delete (window as { matchMedia?: typeof window.matchMedia }).matchMedia;
});

describe('PlaythroughDot', () => {
  it('renders nothing while not playing', () => {
    setup(seed());
    expect(dot()).toBeNull();
  });

  it('renders nothing when no steps resolve', () => {
    setup(seed([], [{ nodeId: 'ghost', text: 'x' }]));
    play();
    expect(dot()).toBeNull();
  });

  it('parks statically on the first node border at step 0, without animateMotion', () => {
    const initial = seed();
    setup(initial);
    play();
    const at = parkPoint(resolveSteps(initial));
    expect(dot()!.querySelector('g')).toHaveAttribute('transform', `translate(${at.x} ${at.y})`);
    expect(motion()).toBeNull();
  });

  it('draws the four concentric neon circles from DOT_COLOR', () => {
    setup(seed());
    play();
    const circles = [...dot()!.querySelectorAll('circle')];
    expect(circles.map((c) => c.getAttribute('r'))).toEqual(['10', '7', '4.5', '2']);
    expect(circles.slice(0, 3).map((c) => c.getAttribute('fill'))).toEqual([DOT_COLOR, DOT_COLOR, DOT_COLOR]);
    expect(circles[3]).toHaveAttribute('fill', '#d8ffd0');
    expect(circles[1]).toHaveClass('walk-halo');
  });

  it('rides the hop path forward via animateMotion, with no keyPoints', () => {
    const initial = seed([{ id: 'e1', from: 'n1', to: 'n2', label: '' }]);
    setup(initial);
    play();
    advance();
    const hop = hopForStep(initial, 'curved', resolveSteps(initial), 1)!;
    const m = motion()!;
    expect(m).toHaveAttribute('path', hop.d);
    expect(m).toHaveAttribute('dur', '1.8s');
    expect(m).toHaveAttribute('repeatCount', 'indefinite');
    expect(m).not.toHaveAttribute('keyPoints');
    expect(dot()!.querySelector('g')).not.toHaveAttribute('transform');
  });

  it('follows the current edge mode (ortho path once toggled)', () => {
    const initial = seed([{ id: 'e1', from: 'n1', to: 'n2', label: '' }]);
    setup(initial);
    fireEvent.click(screen.getByText('ortho'));
    play();
    advance();
    expect(motion()!).toHaveAttribute('path', hopForStep(initial, 'ortho', resolveSteps(initial), 1)!.d);
  });

  it('runs a reversed hop backwards along the drawn path via keyPoints', () => {
    const initial = seed([{ id: 'e1', from: 'n2', to: 'n1', label: '' }]);
    setup(initial);
    play();
    advance();
    const hop = hopForStep(initial, 'curved', resolveSteps(initial), 1)!;
    expect(hop.reverse).toBe(true);
    const m = motion()!;
    expect(m).toHaveAttribute('path', hop.d);
    expect(m).toHaveAttribute('keyPoints', '1;0');
    expect(m).toHaveAttribute('keyTimes', '0;1');
    expect(m).toHaveAttribute('calcMode', 'linear');
  });

  it('sits statically at the hop midpoint under prefers-reduced-motion', () => {
    setReducedMotion(true);
    const initial = seed([{ id: 'e1', from: 'n1', to: 'n2', label: '' }]);
    setup(initial);
    play();
    advance();
    const hop = hopForStep(initial, 'curved', resolveSteps(initial), 1)!;
    expect(motion()).toBeNull();
    expect(dot()!.querySelector('g')).toHaveAttribute('transform', `translate(${hop.mid.x} ${hop.mid.y})`);
  });
});
