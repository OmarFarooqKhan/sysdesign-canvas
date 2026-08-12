import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders the named SVG and applies a className', () => {
    const { container } = render(<Icon name="server" className="ico" />);
    const span = container.querySelector('span')!;
    expect(span).toHaveClass('ico');
    expect(span.querySelector('svg')).toBeInTheDocument();
  });

  it('renders empty markup for an unknown icon', () => {
    const { container } = render(<Icon name="does-not-exist" />);
    expect(container.querySelector('span')!.innerHTML).toBe('');
  });
});
