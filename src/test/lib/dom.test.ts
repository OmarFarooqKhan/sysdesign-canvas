import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob, textOf } from '../../lib/dom';

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

describe('downloadBlob', () => {
  afterEach(() => vi.restoreAllMocks());

  it('creates a blob url, clicks a download anchor, and revokes the url', () => {
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadBlob(new Blob(['hi']), 'hi.txt');
    expect(create).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith('blob:x');
  });
});
