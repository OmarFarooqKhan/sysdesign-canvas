import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GraphProvider } from '../../store/GraphContext';
import { UIProvider, useUI } from '../../store/UIContext';
import { ViewportProvider } from '../../store/ViewportContext';
import { PlaythroughProvider, usePlaythrough } from '../../store/PlaythroughContext';
import { PresentButton } from '../../components/PresentButton';
import type { GraphState, WalkStep } from '../../types';

const twoSteps: WalkStep[] = [{ nodeId: 'n1', text: 'a' }, { nodeId: 'n2', text: 'b' }];

const seed = (walkthrough?: WalkStep[]): GraphState => ({
  nodes: {
    n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 0, y: 0 },
    n2: { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 100, y: 0 },
  },
  edges: [],
  regions: [],
  seq: 2,
  walkthrough,
});

/** Test-only harness exposing a selection probe and a playthrough probe alongside the button. */
function Harness() {
  const { selectedNodeIds, selectNode } = useUI();
  const { playing, stepIndex, start, next } = usePlaythrough();
  return (
    <>
      <button onClick={() => selectNode('n1')}>select-n1</button>
      <span data-testid="selected-count">{selectedNodeIds.length}</span>
      <span data-testid="playing">{String(playing)}</span>
      <span data-testid="step-index">{stepIndex}</span>
      <button onClick={start}>manual-start</button>
      <button onClick={next}>manual-next</button>
      <PresentButton />
    </>
  );
}

function renderHarness(initial?: GraphState) {
  return render(
    <GraphProvider initial={initial}>
      <UIProvider>
        <ViewportProvider>
          <PlaythroughProvider>
            <Harness />
          </PlaythroughProvider>
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>,
  );
}

const presentBtn = () => screen.getByRole('button', { name: '▶ Present' });

describe('PresentButton', () => {
  it('starts off: aria-pressed false, no active class', () => {
    renderHarness();
    const btn = presentBtn();
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).not.toHaveClass('active');
  });

  it('toggles on: aria-pressed true, active class, and clears any selection', () => {
    renderHarness();
    fireEvent.click(screen.getByText('select-n1'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('1');

    const btn = presentBtn();
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveClass('active');
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
  });

  it('toggles off on a second click', () => {
    renderHarness();
    const btn = presentBtn();
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).not.toHaveClass('active');
  });

  it('Escape (handled by ViewportContext) also flips it back off', () => {
    renderHarness();
    const btn = presentBtn();
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('with authored steps, clicking Present auto-starts the playthrough', () => {
    renderHarness(seed(twoSteps));
    expect(screen.getByTestId('playing')).toHaveTextContent('false');
    fireEvent.click(presentBtn());
    expect(presentBtn()).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('playing')).toHaveTextContent('true');
  });

  it('with zero steps, Present toggles presenting but playing stays false', () => {
    renderHarness(seed());
    fireEvent.click(presentBtn());
    expect(presentBtn()).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('playing')).toHaveTextContent('false');
  });

  it('Present-off while playing stops the playthrough', () => {
    renderHarness(seed(twoSteps));
    fireEvent.click(presentBtn());
    expect(screen.getByTestId('playing')).toHaveTextContent('true');
    fireEvent.click(presentBtn());
    expect(presentBtn()).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('playing')).toHaveTextContent('false');
  });

  it('Present while already playing does not reset the current step', () => {
    renderHarness(seed(twoSteps));
    fireEvent.click(screen.getByText('manual-start'));
    fireEvent.click(screen.getByText('manual-next'));
    expect(screen.getByTestId('step-index')).toHaveTextContent('1');

    fireEvent.click(presentBtn());
    expect(presentBtn()).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('playing')).toHaveTextContent('true');
    expect(screen.getByTestId('step-index')).toHaveTextContent('1');
  });
});
