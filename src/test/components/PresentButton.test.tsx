import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UIProvider, useUI } from '../../store/UIContext';
import { ViewportProvider } from '../../store/ViewportContext';
import { PresentButton } from '../../components/PresentButton';

/** Test-only harness exposing a selection probe alongside the button. */
function Harness() {
  const { selectedNodeIds, selectNode } = useUI();
  return (
    <>
      <button onClick={() => selectNode('n1')}>select-n1</button>
      <span data-testid="selected-count">{selectedNodeIds.length}</span>
      <PresentButton />
    </>
  );
}

function renderHarness() {
  return render(
    <UIProvider>
      <ViewportProvider>
        <Harness />
      </ViewportProvider>
    </UIProvider>,
  );
}

describe('PresentButton', () => {
  it('starts off: aria-pressed false, no active class', () => {
    renderHarness();
    const btn = screen.getByRole('button', { name: '▶ Present' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).not.toHaveClass('active');
  });

  it('toggles on: aria-pressed true, active class, and clears any selection', () => {
    renderHarness();
    fireEvent.click(screen.getByText('select-n1'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('1');

    const btn = screen.getByRole('button', { name: '▶ Present' });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveClass('active');
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
  });

  it('toggles off on a second click', () => {
    renderHarness();
    const btn = screen.getByRole('button', { name: '▶ Present' });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).not.toHaveClass('active');
  });

  it('Escape (handled by ViewportContext) also flips it back off', () => {
    renderHarness();
    const btn = screen.getByRole('button', { name: '▶ Present' });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });
});
