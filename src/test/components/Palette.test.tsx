import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PALETTE } from '../../data/palette';
import { Palette } from '../../components/Palette';

describe('Palette', () => {
  it('renders every group heading and item label', () => {
    render(<Palette />);
    for (const section of PALETTE) {
      expect(screen.getByText(section.group)).toBeInTheDocument();
      for (const item of section.items) {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      }
    }
  });

  it('dragstart sets the item payload on the dataTransfer', () => {
    render(<Palette />);
    const first = PALETTE[0].items[0];
    const el = screen.getByText(first.label).closest('.pal-item') as HTMLElement;
    const setData = vi.fn();
    fireEvent.dragStart(el, { dataTransfer: { setData } });
    expect(setData).toHaveBeenCalledWith('text/plain', JSON.stringify(first));
  });

  it('collapses to hide the title/groups/items and restores them on toggle', () => {
    const { container } = render(<Palette />);
    const firstGroup = PALETTE[0].group;
    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText(firstGroup)).toBeInTheDocument();

    const collapseBtn = screen.getByRole('button', { name: 'Collapse palette' });
    fireEvent.click(collapseBtn);

    expect(container.querySelector('.palette')).toHaveClass('collapsed');
    expect(screen.queryByText('Components')).not.toBeInTheDocument();
    expect(screen.queryByText(firstGroup)).not.toBeInTheDocument();

    const expandBtn = screen.getByRole('button', { name: 'Expand palette' });
    fireEvent.click(expandBtn);

    expect(container.querySelector('.palette')).not.toHaveClass('collapsed');
    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText(firstGroup)).toBeInTheDocument();
  });

  it('renders nothing while presenting (D1)', () => {
    const { container } = render(<Palette presenting />);
    expect(container).toBeEmptyDOMElement();
  });
});
