import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewportProvider, useViewport } from '../../store/ViewportContext';
import { ZoomControls } from '../../components/ZoomControls';
import { ZOOM_MAX, ZOOM_MIN } from '../../lib/viewport';

function Harness() {
  const { setViewport } = useViewport();
  return (
    <>
      <button onClick={() => setViewport({ zoom: ZOOM_MIN })}>set-min</button>
      <button onClick={() => setViewport({ zoom: ZOOM_MAX })}>set-max</button>
      <ZoomControls />
    </>
  );
}

function setup() {
  return render(
    <ViewportProvider>
      <Harness />
    </ViewportProvider>,
  );
}

describe('ZoomControls', () => {
  it('shows the current zoom as a percentage', () => {
    setup();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('zoom in/out step the percentage', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByText('125%')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('disables zoom out at the minimum and zoom in at the maximum', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByText('set-min'));
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled();

    await user.click(screen.getByText('set-max'));
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeEnabled();
  });
});
