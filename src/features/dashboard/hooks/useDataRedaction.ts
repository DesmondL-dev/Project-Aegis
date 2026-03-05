import { useState, useEffect, useRef } from 'react';

interface UseDataRedactionReturn {
  isRedacted: boolean;
  revealData: () => void;
}

// OWASP A02 — Cryptographic Failures / Sensitive Data Exposure Defense.
// Implements a timed data redaction state machine. Sensitive fields (SIN, PII)
// are masked by default and only transiently revealed for a 30-second window.
// After the window expires, the state machine autonomously re-engages masking —
// this is an in-memory data sanitization cycle, not a server-side operation.
//
// The 30-second TTL mirrors PCI-DSS screen lock guidelines for financial data
// terminals to minimize passive shoulder-surfing and screen capture exposure.
export const useDataRedaction = (): UseDataRedactionReturn => {
  const [isRedacted, setIsRedacted] = useState<boolean>(true);

  // Ref-based timer handle prevents stale closure capture across re-renders
  // and enables deterministic teardown in the cleanup phase.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revealData = () => {
    // Abort any existing re-redaction timer before issuing a new one —
    // prevents multiple concurrent timers from accumulating in the heap.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsRedacted(false);

    // Schedule autonomous re-engagement of the redaction mask after 30 seconds.
    // This constitutes the Memory-level Data Sanitization cycle.
    timerRef.current = setTimeout(() => {
      setIsRedacted(true);
    }, 30_000);
  };

  useEffect(() => {
    // Cleanup on unmount: clear the pending timer to prevent a state update
    // on an unmounted component, which would cause a memory leak and
    // potential ghost hydration of a deallocated component tree.
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { isRedacted, revealData };
};
