/** textContent of an element as a plain string ('' when absent/empty). */
export const textOf = (el: HTMLElement | null): string => (el && el.textContent) || '';

/** Trigger a browser download of a Blob via a throwaway anchor element. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
