import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphProvider } from '../../store/GraphContext';
import { UIProvider } from '../../store/UIContext';
import { ViewportProvider } from '../../store/ViewportContext';
import { PlaythroughProvider } from '../../store/PlaythroughContext';
import { PlaythroughButton } from '../../components/PlaythroughButton';
import type { GraphState, WalkStep } from '../../types';

const seed = (walkthrough?: WalkStep[]): GraphState => ({
  nodes: { n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 0, y: 0 } },
  edges: [],
  regions: [],
  seq: 1,
  ...(walkthrough ? { walkthrough } : {}),
});

function setup(initial: GraphState) {
  return render(
    <GraphProvider initial={initial}>
      <UIProvider>
        <ViewportProvider>
          <PlaythroughProvider>
            <PlaythroughButton />
          </PlaythroughProvider>
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>,
  );
}

const button = () => screen.getByRole('button', { name: '▶ Playthrough' });

describe('PlaythroughButton', () => {
  it('is disabled with an explanatory title when no steps are authored', () => {
    setup(seed());
    expect(button()).toBeDisabled();
    expect(button()).toHaveAttribute('title', expect.stringContaining('right-click a node'));
  });

  it('is disabled when every authored step is orphaned', () => {
    setup(seed([{ nodeId: 'ghost', text: 'x' }]));
    expect(button()).toBeDisabled();
  });

  it('is enabled without a title once a step resolves, and toggles the playthrough', () => {
    setup(seed([{ nodeId: 'n1', text: 'start here' }]));
    expect(button()).toBeEnabled();
    expect(button()).not.toHaveAttribute('title');
    expect(button()).toHaveAttribute('aria-pressed', 'false');
    expect(button()).not.toHaveClass('active');

    fireEvent.click(button());
    expect(button()).toHaveAttribute('aria-pressed', 'true');
    expect(button()).toHaveClass('active');

    fireEvent.click(button());
    expect(button()).toHaveAttribute('aria-pressed', 'false');
    expect(button()).not.toHaveClass('active');
  });
});
