import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { UIProvider, useUI } from '../../store/UIContext';

function Probe() {
  const ui = useUI();
  return (
    <div>
      <span data-testid="node">{ui.selectedId ?? '-'}</span>
      <span data-testid="nodes">{ui.selectedNodeIds.join(',')}</span>
      <span data-testid="region">{ui.selectedRegionId ?? '-'}</span>
      <span data-testid="edge">{ui.selectedEdgeId ?? '-'}</span>
      <span data-testid="mode">{ui.edgeMode}</span>
      <button onClick={() => ui.selectNode('n1')}>selN</button>
      <button onClick={() => ui.selectNode(null)}>selNull</button>
      <button onClick={() => ui.selectNodes(['n1', 'n2', 'n3'])}>selMulti</button>
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

  it('selectNode results in exactly one selected node id', () => {
    setup();
    fireEvent.click(screen.getByText('selN'));
    expect(screen.getByTestId('nodes')).toHaveTextContent('n1');
    expect(screen.getByTestId('node')).toHaveTextContent('n1');
  });

  it('selectNode(null) clears the node selection', () => {
    setup();
    fireEvent.click(screen.getByText('selN'));
    fireEvent.click(screen.getByText('selNull'));
    expect(screen.getByTestId('nodes')).toHaveTextContent('');
    expect(screen.getByTestId('node')).toHaveTextContent('-');
  });

  it('selectNodes sets a multi-selection and selectedId is null when not exactly one', () => {
    setup();
    fireEvent.click(screen.getByText('selMulti'));
    expect(screen.getByTestId('nodes')).toHaveTextContent('n1,n2,n3');
    expect(screen.getByTestId('node')).toHaveTextContent('-');
    fireEvent.click(screen.getByText('selR'));
    expect(screen.getByTestId('nodes')).toHaveTextContent('');
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

  it('seeds edge mode from initialEdgeMode when provided', () => {
    render(<UIProvider initialEdgeMode="ortho"><Probe /></UIProvider>);
    expect(screen.getByTestId('mode')).toHaveTextContent('ortho');
  });
});
