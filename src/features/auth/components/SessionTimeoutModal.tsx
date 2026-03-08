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
    // Full-viewport absolute focus trap — bg-slate-950/95 + backdrop-blur-md
    // enforces visual hierarchy and prevents interaction with the underlying DOM.
    // z-[9999] guarantees elevation above all product chrome at the stacking context ceiling.
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-desc"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg focus:outline-none"
        tabIndex={-1}
      >
        {/* Enterprise-grade visual partition for session invalidation.
            Amber accent replaces blinding crimson — Tier-1 banking compliance signals
            severity without panic; the border is the sole decorative vector. */}
        <div className="border border-slate-600/50 bg-slate-900 p-8 shadow-[0_0_60px_rgba(100,116,139,0.12)]">

          {/* System-level header strip */}
          <div className="flex items-center justify-between mb-6 border-b border-slate-700/60 pb-4">
            <span className="font-mono text-[10px] tracking-[0.3em] text-slate-500 uppercase">
              AEGIS / SESSION.DAEMON
            </span>
            <span className="font-mono text-[10px] tracking-widest text-amber-500/70">
              ● ALERT
            </span>
          </div>

          {/* Primary warning payload — amber denotes high-severity without panic tonality.
              Tier-1 banking compliance: color psychology maps amber to "action required",
              reserving red for irreversible system failures only. */}
          <h2
            id="session-timeout-title"
            className="font-mono text-base tracking-wider text-amber-500 leading-relaxed"
          >
            [ SESSION INTEGRITY COMPROMISED: INACTIVITY DETECTED ]
          </h2>

          {/* Countdown payload — zero-padded MM:SS format anchors the user
              to a wall-clock mental model, reducing cognitive load under duress. */}
          <p
            id="session-timeout-desc"
            className="mt-3 font-mono text-[11px] tracking-wider text-slate-400 leading-relaxed"
          >
            System lock and memory teardown in:{' '}
            <span className="text-amber-500/80 tabular-nums">
              00:{String(secondsLeft).padStart(2, '0')}
            </span>
          </p>

          {/* Countdown progress bar — visual entropy indicator decaying toward teardown.
              Amber fill maintains color system coherence with the warning payload above. */}
          <div className="mt-5 h-px w-full bg-slate-800">
            <div
              className="h-px bg-amber-500/50 transition-all duration-1000 ease-linear"
              style={{ width: `${(secondsLeft / COUNTDOWN_SECONDS) * 100}%` }}
              aria-hidden="true"
            />
          </div>

          {/* CTA strip — re-authorize is the primary action; abort is secondary */}
          <div className="mt-8 flex flex-wrap gap-3">
            {/* Primary CTA — filled weight signals re-authorization as the sanctioned path.
                Heavy visual mass vs. the ghost secondary mirrors enterprise design systems
                where the safe action always dominates optical hierarchy. */}
            <button
              ref={firstFocusRef}
              type="button"
              onClick={onStayLoggedIn}
              className="font-mono text-[11px] tracking-[0.2em] uppercase bg-slate-800 border border-slate-600 text-slate-300 px-5 py-2.5 hover:bg-slate-700 hover:border-slate-500 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              [ RE-AUTHORIZE ]
            </button>
            {/* Secondary CTA — deliberately low visual weight; ghost treatment
                ensures manual teardown requires intentional motor decision. */}
            <button
              type="button"
              onClick={onLogout}
              className="font-mono text-[11px] tracking-[0.2em] uppercase border border-slate-700 text-slate-600 px-5 py-2.5 hover:border-slate-500 hover:text-slate-400 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-600"
            >
              [ INITIATE TEARDOWN ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
