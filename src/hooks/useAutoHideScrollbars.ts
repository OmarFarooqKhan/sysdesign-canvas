import { useEffect } from 'react';

const HIDE_DELAY_MS = 1200;

/**
 * Reveals a scrollbar (via the `.scrolling` class, styled in index.css) for the duration of
 * a scroll gesture on any element, then fades it back out after a short idle period.
 */
export function useAutoHideScrollbars() {
  useEffect(() => {
    const timers = new WeakMap<Element, ReturnType<typeof setTimeout>>();
    const onScroll = (e: Event) => {
      const el = e.target;
      if (!(el instanceof Element)) return;
      el.classList.add('scrolling');
      const pending = timers.get(el);
      if (pending) clearTimeout(pending);
      timers.set(el, setTimeout(() => el.classList.remove('scrolling'), HIDE_DELAY_MS));
    };
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', onScroll, true);
  }, []);
}
