import { useEffect, useRef, useState } from 'react';

const COUNTDOWN_SECONDS = 60;
const FOCUS_TRAP_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface SessionTimeoutModalProps {
  isOpen: boolean;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

/**
 * Countdown teardown modal — view layer for dual-phase session timeout.
 * When open: 60s countdown via setInterval; at 0 invokes onLogout.
 * AODA: role="dialog", aria-modal, focus trap, highest z-index.
 */
export function SessionTimeoutModal({
  isOpen,
  onStayLoggedIn,
  onLogout,
}: SessionTimeoutModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(COUNTDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen, onLogout]);

  useEffect(() => {
    if (!isOpen) return;
    const container = modalRef.current;
    if (!container) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    firstFocusRef.current?.focus();

    const getTabbable = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUS_TRAP_SELECTOR))
        .filter((el) => !el.hasAttribute('disabled'));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onStayLoggedIn();
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
      container.removeEventListener('keydown', handleKeyDown, true);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onStayLoggedIn]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-desc"
    >
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onStayLoggedIn}
      />
      <div
        ref={modalRef}
        className="relative w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl focus:outline-none"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <h2
          id="session-timeout-title"
          className="text-lg font-semibold text-text-primary"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Session timeout warning
        </h2>
        <p
          id="session-timeout-desc"
          className="mt-2 text-sm text-text-muted"
          style={{ color: 'var(--color-text-muted)' }}
        >
          You have been inactive. For your security, you will be logged out in{' '}
          <strong className="font-semibold text-text-primary">{secondsLeft}</strong>{' '}
          seconds.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            ref={firstFocusRef}
            type="button"
            onClick={onStayLoggedIn}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-border-focus"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          >
            Stay Logged In
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-border-focus"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            Log out now
          </button>
        </div>
      </div>
    </div>
  );
}
