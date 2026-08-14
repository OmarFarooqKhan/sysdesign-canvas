import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import { UIProvider } from '../../store/UIContext';
import { ViewportProvider } from '../../store/ViewportContext';
import { PlaythroughProvider, usePlaythrough } from '../../store/PlaythroughContext';
import { PlaythroughPanel } from '../../components/PlaythroughPanel';
import type { GraphState, WalkStep } from '../../types';

const steps: WalkStep[] = [
  { nodeId: 'n1', text: 'The request lands at the API.' },
  { nodeId: 'n2', text: 'It reads from the DB.' },
  { nodeId: 'n3', text: 'Hot keys come from the cache.' },
];

const seed = (walkthrough: WalkStep[] = steps): GraphState => ({
  nodes: {
    n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 0, y: 0 },
    n2: { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 200, y: 0 },
    n3: { id: 'n3', key: 'cache', icon: 'cache', label: 'Cache', x: 400, y: 0 },
  },
  edges: [],
  regions: [],
  seq: 3,
  walkthrough,
});

function Controls() {
  const { start } = usePlaythrough();
  const { dispatch } = useGraph();
  return (
    <>
      <button onClick={start}>walk-start</button>
      <button onClick={() => dispatch({ type: 'DELETE_NODE', id: 'n3' })}>delete-n3</button>
    </>
  );
}

function setup(initial: GraphState = seed()) {
  return render(
    <GraphProvider initial={initial}>
      <UIProvider>
        <ViewportProvider>
          <PlaythroughProvider>
            <Controls />
            <PlaythroughPanel />
          </PlaythroughProvider>
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>,
  );
}

const panel = () => document.querySelector('.walk-panel');
const play = () => fireEvent.click(screen.getByText('walk-start'));

describe('PlaythroughPanel', () => {
  it('renders nothing while not playing', () => {
    setup();
    expect(panel()).toBeNull();
  });

  it('renders nothing while playing if no steps resolve', () => {
    setup(seed([{ nodeId: 'ghost', text: 'x' }]));
    play();
    expect(panel()).toBeNull();
  });

  it('shows step 1 content: counter, title, text, no hop line, Back disabled', () => {
    setup();
    play();
    expect(panel()).not.toBeNull();
    expect(document.querySelector('.walk-eyebrow')!.textContent).toBe('STEP 1 OF 3');
    expect(document.querySelector('.walk-title')!.textContent).toBe('API');
    expect(document.querySelector('.walk-hop-line')).toBeNull();
    expect(document.querySelector('.walk-body')!.textContent).toBe('The request lands at the API.');
    expect(screen.getByRole('button', { name: '← Back' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next →' })).toBeEnabled();
    expect(document.querySelector('.walk-hint')!.textContent).toBe('Esc exits · ← → step');
  });

  it('Next advances: hop line appears and Back re-enables; Back reverses', () => {
    setup();
    play();
    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
    expect(document.querySelector('.walk-eyebrow')!.textContent).toBe('STEP 2 OF 3');
    expect(document.querySelector('.walk-title')!.textContent).toBe('DB');
    expect(document.querySelector('.walk-hop-line')!.textContent).toBe('API → DB');
    expect(screen.getByRole('button', { name: '← Back' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect(document.querySelector('.walk-eyebrow')!.textContent).toBe('STEP 1 OF 3');
  });

  it('arrow keys drive the panel too', () => {
    setup();
    play();
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(document.querySelector('.walk-eyebrow')!.textContent).toBe('STEP 2 OF 3');
  });

  it('reads Done on the last step and stops the playthrough when clicked', () => {
    setup();
    play();
    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
    const done = screen.getByRole('button', { name: 'Done' });
    expect(done).toHaveClass('primary');
    fireEvent.click(done);
    expect(panel()).toBeNull();
  });

  it('progress dots mark the active step and jump on click', () => {
    setup();
    play();
    const dots = () => [...document.querySelectorAll('.walk-progress-dot')];
    expect(dots()).toHaveLength(3);
    expect(dots()[0]).toHaveClass('active');
    expect(dots()[0]).toHaveAttribute('aria-current', 'true');
    expect(dots()[1]).not.toHaveClass('active');
    expect(dots()[1]).not.toHaveAttribute('aria-current');
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 3' }));
    expect(document.querySelector('.walk-eyebrow')!.textContent).toBe('STEP 3 OF 3');
    expect(dots()[2]).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('shrinks the count and clamps the shown step when a stepped node is deleted mid-tour', () => {
    setup();
    play();
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 3' }));
    fireEvent.click(screen.getByText('delete-n3'));
    expect(document.querySelector('.walk-eyebrow')!.textContent).toBe('STEP 2 OF 2');
    expect(document.querySelector('.walk-title')!.textContent).toBe('DB');
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });
});
