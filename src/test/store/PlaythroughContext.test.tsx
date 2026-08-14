import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import { UIProvider, useUI } from '../../store/UIContext';
import { ViewportProvider, useViewport } from '../../store/ViewportContext';
import { PlaythroughProvider, usePlaythrough } from '../../store/PlaythroughContext';
import type { GraphState } from '../../types';

const seed = (): GraphState => ({
  nodes: {
    n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 0, y: 0 },
    n2: { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 200, y: 0 },
    n3: { id: 'n3', key: 'cache', icon: 'cache', label: 'Cache', x: 400, y: 0 },
  },
  edges: [],
  regions: [],
  seq: 3,
  walkthrough: [{ nodeId: 'n1', text: 'a' }, { nodeId: 'n2', text: 'b' }, { nodeId: 'n3', text: 'c' }],
});

function Probe() {
  const p = usePlaythrough();
  const { presenting, togglePresenting } = useViewport();
  const { selectedNodeIds, selectNode } = useUI();
  const { dispatch } = useGraph();
  return (
    <>
      <span data-testid="state">{`${p.playing},${p.stepIndex},${presenting}`}</span>
      <span data-testid="selection">{selectedNodeIds.join(',')}</span>
      <button onClick={p.start}>start</button>
      <button onClick={p.stop}>stop</button>
      <button onClick={p.next}>next</button>
      <button onClick={p.prev}>prev</button>
      <button onClick={() => p.goTo(2)}>goto-2</button>
      <button onClick={() => p.goTo(99)}>goto-99</button>
      <button onClick={togglePresenting}>toggle-presenting</button>
      <button onClick={() => selectNode('n1')}>select-n1</button>
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
            <Probe />
          </PlaythroughProvider>
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>,
  );
}

const state = () => screen.getByTestId('state').textContent;

describe('PlaythroughContext', () => {
  it('throws when used outside a provider', () => {
    function Bare() { usePlaythrough(); return null; }
    expect(() => render(<Bare />)).toThrow('usePlaythrough must be used within a PlaythroughProvider');
  });

  it('starts stopped at step 0; start/stop flip playing', () => {
    setup();
    expect(state()).toBe('false,0,false');
    fireEvent.click(screen.getByText('start'));
    expect(state()).toBe('true,0,false');
    fireEvent.click(screen.getByText('stop'));
    expect(state()).toBe('false,0,false');
  });

  it('next/prev step and clamp at both ends; goTo jumps clamped', () => {
    setup();
    fireEvent.click(screen.getByText('start'));
    fireEvent.click(screen.getByText('next'));
    expect(state()).toBe('true,1,false');
    fireEvent.click(screen.getByText('next'));
    fireEvent.click(screen.getByText('next'));
    expect(state()).toBe('true,2,false');
    fireEvent.click(screen.getByText('prev'));
    fireEvent.click(screen.getByText('prev'));
    fireEvent.click(screen.getByText('prev'));
    expect(state()).toBe('true,0,false');
    fireEvent.click(screen.getByText('goto-2'));
    expect(state()).toBe('true,2,false');
    fireEvent.click(screen.getByText('goto-99'));
    expect(state()).toBe('true,2,false');
  });

  it('start resets the step index to 0 and clears the selection', () => {
    setup();
    fireEvent.click(screen.getByText('select-n1'));
    expect(screen.getByTestId('selection')).toHaveTextContent('n1');
    fireEvent.click(screen.getByText('start'));
    fireEvent.click(screen.getByText('next'));
    fireEvent.click(screen.getByText('stop'));
    fireEvent.click(screen.getByText('start'));
    expect(state()).toBe('true,0,false');
    expect(screen.getByTestId('selection').textContent).toBe('');
  });

  it('arrow keys step (clamped) and other keys are ignored while playing', () => {
    setup();
    fireEvent.click(screen.getByText('start'));
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(state()).toBe('true,2,false');
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(state()).toBe('true,2,false');
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    expect(state()).toBe('true,0,false');
  });

  it('keys do nothing while not playing', () => {
    setup();
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(state()).toBe('false,0,false');
  });

  it('Escape exits the playthrough only, leaving an active presenting toggle as it was', () => {
    setup();
    fireEvent.click(screen.getByText('toggle-presenting'));
    fireEvent.click(screen.getByText('start'));
    expect(state()).toBe('true,0,true');
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(state()).toBe('false,0,true');
    // A second Escape (no playthrough running) now exits presentation as before.
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(state()).toBe('false,0,false');
  });

  it('survives the step count shrinking mid-tour (deleted node): stepping clamps to the new count', () => {
    setup();
    fireEvent.click(screen.getByText('start'));
    fireEvent.click(screen.getByText('goto-2'));
    fireEvent.click(screen.getByText('delete-n3'));
    fireEvent.click(screen.getByText('next'));
    expect(state()).toBe('true,1,false');
  });
});
