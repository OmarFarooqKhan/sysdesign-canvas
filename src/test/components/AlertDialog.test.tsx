import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { AlertDialog } from '../../components/AlertDialog';

describe('AlertDialog', () => {
  it('renders the message', () => {
    render(<AlertDialog message="Could not import: bad json" onClose={vi.fn()} />);
    expect(screen.getByText('Could not import: bad json')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<AlertDialog message="oops" onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ignores non-Escape keys', () => {
    const onClose = vi.fn();
    render(<AlertDialog message="oops" onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on backdrop click / OK button', () => {
    const onClose = vi.fn();
    render(<AlertDialog message="oops" onClose={onClose} />);
    fireEvent.mouseDown(document.querySelector('.alert-backdrop')!);
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('OK'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('does not close when clicking inside the modal body', () => {
    const onClose = vi.fn();
    render(<AlertDialog message="oops" onClose={onClose} />);
    fireEvent.mouseDown(document.querySelector('.alert-modal')!);
    expect(onClose).not.toHaveBeenCalled();
  });
});
