import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Guides } from '../../components/Guides';

describe('Guides', () => {
  it('renders nothing when there are no active guides', () => {
    const { container } = render(<Guides guides={null} />);
    expect(container.querySelectorAll('.guide')).toHaveLength(0);
  });

  it('renders nothing when the guide arrays are both empty', () => {
    const { container } = render(<Guides guides={{ vertical: [], horizontal: [] }} />);
    expect(container.querySelectorAll('.guide')).toHaveLength(0);
  });

  it('renders a vertical line at each matched x coordinate', () => {
    const { container } = render(<Guides guides={{ vertical: [100, 250], horizontal: [] }} />);
    const lines = container.querySelectorAll('.guide-v');
    expect(lines).toHaveLength(2);
    expect((lines[0] as HTMLElement).style.left).toBe('100px');
    expect((lines[1] as HTMLElement).style.left).toBe('250px');
  });

  it('renders a horizontal line at each matched y coordinate', () => {
    const { container } = render(<Guides guides={{ vertical: [], horizontal: [50] }} />);
    const lines = container.querySelectorAll('.guide-h');
    expect(lines).toHaveLength(1);
    expect((lines[0] as HTMLElement).style.top).toBe('50px');
  });
});
