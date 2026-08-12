import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { UIProvider, useUI } from './UIContext';

function Probe() {
  const ui = useUI();
  return (
    <div>
      <span data-testid="node">{ui.selectedId ?? '-'}</span>
      <span data-testid="region">{ui.selectedRegionId ?? '-'}</span>
      <span data-testid="edge">{ui.selectedEdgeId ?? '-'}</span>
      <span data-testid="mode">{ui.edgeMode}</span>
      <button onClick={() => ui.selectNode('n1')}>selN</button>
      <button onClick={() => ui.selectRegion('r1')}>selR</button>
      <button onClick={() => ui.selectEdge('e1')}>selE</button>
      <button onClick={() => ui.clearSelection()}>clear</button>
      <button onClick={() => ui.toggleEdgeMode()}>toggle</button>
      <button onClick={() => ui.setEdgeMode('ortho')}>ortho</button>
    </div>
  );
}

const setup = () => render(<UIProvider><Probe /></UIProvider>);

describe('UIContext', () => {
  it('selecting a node clears region and edge selection, and vice versa', () => {
    setup();
    fireEvent.click(screen.getByText('selN'));
    expect(screen.getByTestId('node')).toHaveTextContent('n1');
    fireEvent.click(screen.getByText('selR'));
    expect(screen.getByTestId('region')).toHaveTextContent('r1');
    expect(screen.getByTestId('node')).toHaveTextContent('-');
    fireEvent.click(screen.getByText('selE'));
    expect(screen.getByTestId('edge')).toHaveTextContent('e1');
    expect(screen.getByTestId('region')).toHaveTextContent('-');
    fireEvent.click(screen.getByText('selN'));
    expect(screen.getByTestId('node')).toHaveTextContent('n1');
    expect(screen.getByTestId('edge')).toHaveTextContent('-');
  });

  it('clearSelection resets all three', () => {
    setup();
    fireEvent.click(screen.getByText('selN'));
    fireEvent.click(screen.getByText('clear'));
    expect(screen.getByTestId('node')).toHaveTextContent('-');
    expect(screen.getByTestId('region')).toHaveTextContent('-');
    expect(screen.getByTestId('edge')).toHaveTextContent('-');
  });

  it('toggles and sets edge mode', () => {
    setup();
    expect(screen.getByTestId('mode')).toHaveTextContent('curved');
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('mode')).toHaveTextContent('ortho');
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('mode')).toHaveTextContent('curved');
    fireEvent.click(screen.getByText('ortho'));
    expect(screen.getByTestId('mode')).toHaveTextContent('ortho');
  });

  it('throws when used outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/UIProvider/);
    vi.restoreAllMocks();
  });
});
