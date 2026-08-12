import { describe, expect, it } from 'vitest';
import { textOf } from '../../lib/dom';

describe('textOf', () => {
  it('returns empty string for null', () => {
    expect(textOf(null)).toBe('');
  });

  it('returns the element text when present', () => {
    const el = document.createElement('div');
    el.textContent = 'Hello';
    expect(textOf(el)).toBe('Hello');
  });

  it('returns empty string for an empty element', () => {
    expect(textOf(document.createElement('div'))).toBe('');
  });
});
