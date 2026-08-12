import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { EdgeView } from './EdgeView';
import type { Edge, GraphNode } from '../types';

const from: GraphNode = { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 100, y: 100 };
const to: GraphNode = { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 300, y: 100 };
const edge: Edge = { id: 'e1', from: 'n1', to: 'n2', label: 'calls' };

function renderEdge(overrides: Partial<Parameters<typeof EdgeView>[0]> = {}, onSelect = vi.fn()) {
  const props = { edge, from, to, edgeMode: 'curved' as const, selected: false, onSelect, ...overrides };
  const utils = render(
    <svg>
      <EdgeView {...props} />
    </svg>,
  );
  return { ...utils, onSelect };
}

describe('EdgeView', () => {
  it('renders a path for curved mode', () => {
    const { container } = renderEdge({ edgeMode: 'curved' });
    const path = container.querySelector('path.edge')!;
    expect(path).toBeTruthy();
    expect(path.getAttribute('d')).toContain('C');
    expect(path.getAttribute('stroke')).toBe('#5b6b8c');
  });

  it('renders a path for ortho mode', () => {
    const { container } = renderEdge({ edgeMode: 'ortho' });
    const path = container.querySelector('path.edge')!;
    expect(path.getAttribute('d')).toContain('L');
  });

  it('uses accent stroke when selected', () => {
    const { container } = renderEdge({ selected: true });
    const path = container.querySelector('path.edge')!;
    expect(path.getAttribute('stroke')).toBe('#4f8cff');
  });

  it('omits the start marker for a one-way edge', () => {
    const { container } = renderEdge();
    const path = container.querySelector('path.edge')!;
    expect(path.getAttribute('marker-start')).toBeNull();
    expect(path.getAttribute('marker-end')).toBe('url(#arrow)');
  });

  it('renders a start marker too when the edge is bidirectional', () => {
    const { container } = renderEdge({ edge: { ...edge, bidirectional: true } });
    const path = container.querySelector('path.edge')!;
    expect(path.getAttribute('marker-start')).toBe('url(#arrow)');
  });

  it('renders the edge label at the path midpoint', () => {
    const { container } = renderEdge();
    const text = container.querySelector('text.edge-label')!;
    expect(text.textContent).toBe('calls');
  });

  it('calls onSelect with the edge and click coordinates when path is clicked', () => {
    const { container, onSelect } = renderEdge();
    const path = container.querySelector('path.edge')!;
    path.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 50, clientY: 60 }));
    expect(onSelect).toHaveBeenCalledWith(edge, 50, 60);
  });

  it('calls onSelect when the label text is clicked', () => {
    const { container, onSelect } = renderEdge();
    const text = container.querySelector('text.edge-label')!;
    text.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 10, clientY: 20 }));
    expect(onSelect).toHaveBeenCalledWith(edge, 10, 20);
  });
});
