import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { ConfirmDialog } from '../../components/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders the message', () => {
    render(<ConfirmDialog message="Clear the whole canvas?" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Clear the whole canvas?')).toBeInTheDocument();
  });

  it('cancels on Escape', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog message="oops" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('ignores non-Escape keys', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog message="oops" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'a' });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels on backdrop click / Cancel button, without confirming', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog message="oops" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.mouseDown(document.querySelector('.alert-backdrop')!);
    expect(onCancel).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('does not cancel when clicking inside the modal body', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog message="oops" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.mouseDown(document.querySelector('.alert-modal')!);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('confirms via the OK button', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog message="oops" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('OK'));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
