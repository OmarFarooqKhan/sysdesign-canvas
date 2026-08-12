import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAutoHideScrollbars } from '../../hooks/useAutoHideScrollbars';

function Harness() {
  useAutoHideScrollbars();
  return <div data-testid="scroll-el" style={{ overflow: 'auto' }} />;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useAutoHideScrollbars', () => {
  it('adds the scrolling class on scroll and removes it after the idle delay', () => {
    render(<Harness />);
    const el = screen.getByTestId('scroll-el');
    el.dispatchEvent(new Event('scroll', { bubbles: true }));
    expect(el).toHaveClass('scrolling');

    vi.advanceTimersByTime(1199);
    expect(el).toHaveClass('scrolling');

    vi.advanceTimersByTime(1);
    expect(el).not.toHaveClass('scrolling');
  });

  it('repeated scrolling resets the idle timer instead of stacking', () => {
    render(<Harness />);
    const el = screen.getByTestId('scroll-el');
    el.dispatchEvent(new Event('scroll', { bubbles: true }));
    vi.advanceTimersByTime(600);
    el.dispatchEvent(new Event('scroll', { bubbles: true }));
    vi.advanceTimersByTime(700);
    expect(el).toHaveClass('scrolling');

    vi.advanceTimersByTime(500);
    expect(el).not.toHaveClass('scrolling');
  });

  it('ignores scroll events whose target is not an element', () => {
    render(<Harness />);
    expect(() => window.dispatchEvent(new Event('scroll'))).not.toThrow();
  });

  it('stops listening after unmount', () => {
    const { unmount } = render(<Harness />);
    const el = screen.getByTestId('scroll-el');
    unmount();
    expect(() => el.dispatchEvent(new Event('scroll', { bubbles: true }))).not.toThrow();
  });
});
