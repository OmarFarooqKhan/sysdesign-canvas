import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { GraphState } from '../../types';
import { GraphProvider } from '../../store/GraphContext';
import { EmptyState } from '../../components/EmptyState';

const region = { id: 'r1', title: 'Backend', x: 100, y: 100, w: 260, h: 180, color: '#34d399' };
const node = { id: 'n1', key: 'db', icon: '🗄️', label: 'DB', x: 10, y: 10 };

describe('EmptyState', () => {
  it('renders the empty-state hint when the graph has no nodes or regions', () => {
    const initial: GraphState = { nodes: {}, edges: [], regions: [], seq: 0 };
    const { container } = render(
      <GraphProvider initial={initial}>
        <EmptyState />
      </GraphProvider>,
    );
    expect(container.querySelector('.empty-state')).toBeTruthy();
    expect(container.textContent).toContain('Drag a component from the left onto the canvas');
  });

  it('returns null when a node exists', () => {
    const initial: GraphState = { nodes: { n1: node }, edges: [], regions: [], seq: 1 };
    const { container } = render(
      <GraphProvider initial={initial}>
        <EmptyState />
      </GraphProvider>,
    );
    expect(container.querySelector('.empty-state')).toBeNull();
  });

  it('returns null when a region exists', () => {
    const initial: GraphState = { nodes: {}, edges: [], regions: [region], seq: 1 };
    const { container } = render(
      <GraphProvider initial={initial}>
        <EmptyState />
      </GraphProvider>,
    );
    expect(container.querySelector('.empty-state')).toBeNull();
  });
});
