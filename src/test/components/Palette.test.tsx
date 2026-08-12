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
});
