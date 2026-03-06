import { useEffect, useRef, useCallback } from 'react';

// Activity events that constitute evidence of an active user session.
// `wheel` and `touchstart` capture non-keyboard, non-mouse interaction
// modalities (scroll devices, touch screens) to prevent false idle triggers.
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'wheel', 'touchstart'] as const;

const DEFAULT_IDLE_TIME_MS = 5 * 60 * 1_000; // 5 minutes — OWASP A07 recommended session idle limit

interface UseIdleTimeoutOptions {
  idleTimeMs?: number;
  onIdle:      () => void;
}

interface UseIdleTimeoutReturn {
  resetTimer: () => void;
}

// Lightweight leading-edge throttle utility.
// Guarantees the handler fires at most once per `limitMs` interval,
// protecting the main thread from layout thrash caused by high-frequency
// events (e.g., `mousemove` at 60hz) saturating the event loop.
// A trailing-edge debounce is deliberately avoided here — we want the
// timer reset to register immediately on activity, not after the burst ends.
const throttle = <T extends unknown[]>(
  fn: (...args: T) => void,
  limitMs: number
): ((...args: T) => void) => {
  let lastFired = 0;
  return (...args: T) => {
    const now = Date.now();
    if (now - lastFired >= limitMs) {
      lastFired = now;
      fn(...args);
    }
  };
};

// useIdleTimeout — Session Inactivity Detection Engine.
//
// Implements OWASP A07 (Identification and Authentication Failures) mitigation
// by enforcing a configurable idle window. After `idleTimeMs` of no user
// interaction, `onIdle` is fired to trigger the session warning intercept.
//
// Architecture:
// - A single `setTimeout` tracks the idle window. Any detected activity resets it.
// - The activity handler is throttled at 500ms to prevent event storms from
//   degrading main-thread performance during high-frequency interactions.
// - All event listeners and timers are torn down on component unmount to
//   prevent memory leaks and ghost callbacks on deallocated component trees.
export const useIdleTimeout = ({
  idleTimeMs = DEFAULT_IDLE_TIME_MS,
  onIdle,
}: UseIdleTimeoutOptions): UseIdleTimeoutReturn => {
  const idleTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable ref for onIdle — avoids stale closure capture when the callback
  // identity changes across parent re-renders.
  const onIdleRef     = useRef<() => void>(onIdle);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      onIdleRef.current();
    }, idleTimeMs);
  }, [idleTimeMs, clearIdleTimer]);

  // Public API — allows the SessionTimeoutModal "Stay Logged In" action
  // to reset the idle clock without unmounting the hook.
  const resetTimer = useCallback(() => {
    startIdleTimer();
  }, [startIdleTimer]);

  useEffect(() => {
    // Throttled activity handler — 500ms resolution is sufficient to detect
    // user presence while suppressing the raw event frequency of `mousemove`.
    const handleActivity = throttle(() => {
      startIdleTimer();
    }, 500);

    // Bootstrap the idle timer on mount.
    startIdleTimer();

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Unmount cleanup — teardown all listeners and cancel the pending timer.
    // Failure to clean up would cause the onIdle callback to fire after
    // the component is removed, triggering a state update on a deallocated tree.
    return () => {
      clearIdleTimer();
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [startIdleTimer, clearIdleTimer]);

  return { resetTimer };
};
