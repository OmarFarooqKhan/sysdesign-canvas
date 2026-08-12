/** textContent of an element as a plain string ('' when absent/empty). */
export const textOf = (el: HTMLElement | null): string => (el && el.textContent) || '';
