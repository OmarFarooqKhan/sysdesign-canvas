import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewportProvider, useViewport } from '../../store/ViewportContext';
import { ZOOM_MAX, ZOOM_MIN } from '../../lib/viewport';

function Probe() {
  const v = useViewport();
  return (
    <>
      <span data-testid="state">{`${v.zoom},${v.panX},${v.panY},${v.panMode},${v.presenting}`}</span>
      <button onClick={v.zoomIn}>in</button>
      <button onClick={v.zoomOut}>out</button>
      <button onClick={() => v.setViewport({ zoom: 1.5 })}>set-zoom</button>
      <button onClick={() => v.setViewport({ panX: 40, panY: -10 })}>set-pan</button>
      <button onClick={() => v.panBy(5, 6)}>pan-by</button>
      <button onClick={v.togglePanMode}>toggle-pan-mode</button>
      <button onClick={v.togglePresenting}>toggle-presenting</button>
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

  it('starts at zoom 1, no pan, pan mode off, not presenting', () => {
    setup();
    expect(screen.getByTestId('state')).toHaveTextContent('1,0,0,false,false');
  });

  it('zoomIn/zoomOut step and clamp', () => {
    setup();
    fireEvent.click(screen.getByText('in'));
    expect(screen.getByTestId('state')).toHaveTextContent('1.25,0,0,false,false');
    fireEvent.click(screen.getByText('out'));
    fireEvent.click(screen.getByText('out'));
    fireEvent.click(screen.getByText('out'));
    fireEvent.click(screen.getByText('out'));
    fireEvent.click(screen.getByText('out'));
    expect(screen.getByTestId('state')).toHaveTextContent(`${ZOOM_MIN},0,0,false,false`);
    for (let i = 0; i < 10; i++) fireEvent.click(screen.getByText('in'));
    expect(screen.getByTestId('state')).toHaveTextContent(`${ZOOM_MAX},0,0,false,false`);
  });

  it('setViewport applies partial updates and clamps zoom', () => {
    setup();
    fireEvent.click(screen.getByText('set-zoom'));
    expect(screen.getByTestId('state')).toHaveTextContent('1.5,0,0,false,false');
    fireEvent.click(screen.getByText('set-pan'));
    expect(screen.getByTestId('state')).toHaveTextContent('1.5,40,-10,false,false');
  });

  it('panBy accumulates a relative offset', () => {
    setup();
    fireEvent.click(screen.getByText('pan-by'));
    fireEvent.click(screen.getByText('pan-by'));
    expect(screen.getByTestId('state')).toHaveTextContent('1,10,12,false,false');
  });

  it('togglePanMode flips the flag', () => {
    setup();
    fireEvent.click(screen.getByText('toggle-pan-mode'));
    expect(screen.getByTestId('state')).toHaveTextContent('1,0,0,true,false');
    fireEvent.click(screen.getByText('toggle-pan-mode'));
    expect(screen.getByTestId('state')).toHaveTextContent('1,0,0,false,false');
  });

  it('togglePresenting flips the flag', () => {
    setup();
    fireEvent.click(screen.getByText('toggle-presenting'));
    expect(screen.getByTestId('state')).toHaveTextContent('1,0,0,false,true');
    fireEvent.click(screen.getByText('toggle-presenting'));
    expect(screen.getByTestId('state')).toHaveTextContent('1,0,0,false,false');
  });

  it('Escape exits presentation mode', () => {
    setup();
    fireEvent.click(screen.getByText('toggle-presenting'));
    expect(screen.getByTestId('state')).toHaveTextContent('1,0,0,false,true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByTestId('state')).toHaveTextContent('1,0,0,false,false');
  });

  it('Escape does nothing while not presenting', () => {
    setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByTestId('state')).toHaveTextContent('1,0,0,false,false');
  });

  it('a non-Escape key while presenting does not exit', () => {
    setup();
    fireEvent.click(screen.getByText('toggle-presenting'));
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(screen.getByTestId('state')).toHaveTextContent('1,0,0,false,true');
  });
});
