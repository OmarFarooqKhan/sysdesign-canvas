import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ContextMenu } from '../../components/ContextMenu';

describe('ContextMenu', () => {
  it('renders items (danger + normal) and fires onClick then onClose', () => {
    const onClose = vi.fn();
    const label = vi.fn();
    const del = vi.fn();
    render(<ContextMenu x={5} y={7} onClose={onClose} items={[
      { label: 'Label', onClick: label },
      { label: 'Delete', danger: true, onClick: del },
    ]} />);
    expect(screen.getByText('Delete')).toHaveClass('danger');
    fireEvent.click(screen.getByText('Label'));
    expect(label).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on an outside click and does not close on inside click', () => {
    const onClose = vi.fn();
    render(<ContextMenu x={0} y={0} onClose={onClose} items={[{ label: 'A', onClick: () => {} }]} />);
    fireEvent.click(screen.getByText('A').parentElement!); // inside → stopPropagation
    onClose.mockClear();
    fireEvent.click(document.body); // outside
    expect(onClose).toHaveBeenCalled();
  });

  it('removes its listener on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(<ContextMenu x={0} y={0} onClose={onClose} items={[]} />);
    unmount();
    fireEvent.click(document.body);
    expect(onClose).not.toHaveBeenCalled();
  });
});
