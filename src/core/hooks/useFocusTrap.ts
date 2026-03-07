import { useEffect, type RefObject } from 'react';

const FOCUS_TRAP_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface UseFocusTrapOptions {
  /** Ref to the element that receives focus when the trap activates (e.g. close button). */
  firstFocusRef?: RefObject<HTMLElement | null>;
}

// Focus Trap — confines Tab/Shift+Tab to tabbable elements inside the container.
// Loop Boundary wraps last→first and first→last. On teardown, restores focus to
// the element that was active when the trap was opened (WCAG 2.1 SC 2.1.2).
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
  options: UseFocusTrapOptions = {}
): void {
  const { firstFocusRef } = options;

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    firstFocusRef?.current?.focus();

    const getTabbable = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUS_TRAP_SELECTOR))
        .filter((el) => !el.hasAttribute('disabled'));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = getTabbable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const activeIndex = active ? focusable.indexOf(active) : -1;

      if (e.shiftKey) {
        if (activeIndex < 0 || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (activeIndex < 0 || active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown, true);
    return () => {
      previousFocus?.focus();
      container.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, onClose, containerRef, firstFocusRef]);
}
