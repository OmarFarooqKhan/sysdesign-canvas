import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewportProvider, useViewport } from '../../store/ViewportContext';
import { ZOOM_MAX, ZOOM_MIN } from '../../lib/viewport';

function Probe() {
  const v = useViewport();
  return (
    <>
      <span data-testid="state">{`${v.zoom},${v.panX},${v.panY},${v.panMode}`}</span>
      <button onClick={v.zoomIn}>in</button>
      <button onClick={v.zoomOut}>out</button>
      <button onClick={() => v.setViewport({ zoom: 1.5 })}>set-zoom</button>
      <button onClick={() => v.setViewport({ panX: 40, panY: -10 })}>set-pan</button>
      <button onClick={() => v.panBy(5, 6)}>pan-by</button>
      <button onClick={v.togglePanMode}>toggle-pan-mode</button>
    </>
  );
}

function setup() {
  return render(
    <ViewportProvider>
      <Probe />
    </ViewportProvider>,
  );
}

describe('ViewportContext', () => {
  it('throws when used outside a provider', () => {
    function Bare() { useViewport(); return null; }
    expect(() => render(<Bare />)).toThrow('useViewport must be used within a ViewportProvider');
  });

  it('starts at zoom 1, no pan, pan mode off', () => {
    setup();
    expect(screen.getByTestId('state')).toHaveTextContent('1,0,0,false');
  });

  it('zoomIn/zoomOut step and clamp', () => {
    setup();
    fireEvent.click(screen.getByText('in'));
    expect(screen.getByTestId('state')).toHaveTextContent('1.25,0,0,false');
    fireEvent.click(screen.getByText('out'));
    fireEvent.click(screen.getByText('out'));
    fireEvent.click(screen.getByText('out'));
    fireEvent.click(screen.getByText('out'));
    fireEvent.click(screen.getByText('out'));
    expect(screen.getByTestId('state')).toHaveTextContent(`${ZOOM_MIN},0,0,false`);
    for (let i = 0; i < 10; i++) fireEvent.click(screen.getByText('in'));
    expect(screen.getByTestId('state')).toHaveTextContent(`${ZOOM_MAX},0,0,false`);
  });

  it('setViewport applies partial updates and clamps zoom', () => {
    setup();
    fireEvent.click(screen.getByText('set-zoom'));
    expect(screen.getByTestId('state')).toHaveTextContent('1.5,0,0,false');
    fireEvent.click(screen.getByText('set-pan'));
    expect(screen.getByTestId('state')).toHaveTextContent('1.5,40,-10,false');
  });

  it('panBy accumulates a relative offset', () => {
    setup();
    fireEvent.click(screen.getByText('pan-by'));
    fireEvent.click(screen.getByText('pan-by'));
    expect(screen.getByTestId('state')).toHaveTextContent('1,10,12,false');
  });

  it('togglePanMode flips the flag', () => {
    setup();
    fireEvent.click(screen.getByText('toggle-pan-mode'));
    expect(screen.getByTestId('state')).toHaveTextContent('1,0,0,true');
    fireEvent.click(screen.getByText('toggle-pan-mode'));
    expect(screen.getByTestId('state')).toHaveTextContent('1,0,0,false');
  });
});
