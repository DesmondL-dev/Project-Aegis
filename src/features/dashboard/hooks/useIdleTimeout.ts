import { useCallback, useEffect, useRef, useState } from 'react';

const IDLE_MS = 6_0000;
const DEBOUNCE_MS = 150;

/**
 * Silent watcher — data layer for dual-phase session teardown.
 * Tracks user activity via mousemove, keydown, wheel with debouncing.
 * After IDLE_MS of no activity, isIdle flips true (triggers timeout modal in layout).
 *
 * A07 mitigation: Browser background tab throttling can stall setInterval/setTimeout.
 * We reconcile against absolute wall-clock via lastActiveTimestamp and the
 * Visibility API so that when the user returns to the tab we enforce teardown
 * if real elapsed time exceeded IDLE_MS, regardless of throttled timer ticks.
 */
export function useIdleTimeout() {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Wall-clock anchor for the last user-driven activity; used when tab becomes
  // visible again to compute real elapsed idle time and bypass throttled timers.
  const lastActiveTimestampRef = useRef<number>(Date.now());

  const resetIdleTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsIdle(false);
    lastActiveTimestampRef.current = Date.now();
    timerRef.current = setTimeout(() => setIsIdle(true), IDLE_MS);
  }, []);

  useEffect(() => {
    const scheduleReset = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        lastActiveTimestampRef.current = Date.now();
        setIsIdle(false);
        timerRef.current = setTimeout(() => setIsIdle(true), IDLE_MS);
      }, DEBOUNCE_MS);
    };

    const events = ['mousemove', 'keydown', 'wheel'] as const;
    events.forEach((ev) => window.addEventListener(ev, scheduleReset));

    lastActiveTimestampRef.current = Date.now();
    timerRef.current = setTimeout(() => setIsIdle(true), IDLE_MS);

    // Mitigate browser background throttling via Visibility API and absolute time deltas.
    // When the tab becomes visible we compute real idle duration; if it exceeds IDLE_MS
    // we trigger teardown immediately instead of waiting for a possibly stalled timer.
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      const elapsed = now - lastActiveTimestampRef.current;
      if (elapsed >= IDLE_MS) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setIsIdle(true);
        return;
      }
      // Tab was hidden for less than IDLE_MS; reschedule timer for remaining budget
      // so that we don't rely on throttled ticks for the rest of the window.
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      timerRef.current = setTimeout(() => setIsIdle(true), IDLE_MS - elapsed);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, scheduleReset));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Dead Man's Switch — debug escape hatch for live demo environments.
  // Bypasses the IDLE_MS wall clock entirely by directly mutating isIdle to true,
  // collapsing the full idle observation cycle into a single synchronous dispatch.
  // Clears both debounce and idle timers first to prevent a ghost reset race.
  const forceTimeout = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsIdle(true);
  }, []);

  return { isIdle, resetIdleTimer, forceTimeout };
}
