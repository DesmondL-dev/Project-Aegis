import { useCallback, useEffect, useRef, useState } from 'react';

const IDLE_MS = 6_0000;
const DEBOUNCE_MS = 150;

/**
 * Silent watcher — data layer for dual-phase session teardown.
 * Tracks user activity via mousemove, keydown, wheel with debouncing.
 * After IDLE_MS of no activity, isIdle flips true (triggers timeout modal in layout).
 */
export function useIdleTimeout() {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsIdle(false);
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
        setIsIdle(false);
        timerRef.current = setTimeout(() => setIsIdle(true), IDLE_MS);
      }, DEBOUNCE_MS);
    };

    const events = ['mousemove', 'keydown', 'wheel'] as const;
    events.forEach((ev) => window.addEventListener(ev, scheduleReset));

    timerRef.current = setTimeout(() => setIsIdle(true), IDLE_MS);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, scheduleReset));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { isIdle, resetIdleTimer };
}
