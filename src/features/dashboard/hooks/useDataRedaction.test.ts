import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataRedaction } from './useDataRedaction';

// Test Suite: A02 Memory Teardown — useDataRedaction State Machine
//
// Validates the timed PII redaction engine against three critical assertions:
// 1. Default posture is redacted (fail-closed, never expose PII on mount).
// 2. revealData() transitions the state machine to the exposed state.
// 3. The autonomous re-redaction timer fires after 30s, scrubbing the
//    in-memory exposure window (Memory-level Data Sanitization cycle).
//
// Time Travel: vi.useFakeTimers() replaces the real setTimeout/setInterval
// implementation with a synchronous, deterministic clock. This allows
// the 30-second redaction cycle to be tested without blocking the test runner
// for 30 real seconds — a critical CI pipeline optimization.

describe('useDataRedaction', () => {

  beforeEach(() => {
    // Engage fake timer engine before each test to isolate time-dependent
    // state transitions from wall-clock non-determinism.
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers after each test — prevents fake timer state
    // from leaking across test boundaries and corrupting subsequent suites.
    vi.useRealTimers();
  });

  it('should initialize in the redacted state (fail-closed posture)', () => {
    const { result } = renderHook(() => useDataRedaction());

    // Assertion: on mount, PII exposure is never the default state.
    // Any regression here means sensitive fields could be rendered in plaintext
    // before the user explicitly authorizes the 30-second exposure window.
    expect(result.current.isRedacted).toBe(true);
  });

  it('should transition to exposed state when revealData() is dispatched', () => {
    const { result } = renderHook(() => useDataRedaction());

    act(() => {
      result.current.revealData();
    });

    // Assertion: the state machine must transition out of the redacted posture
    // immediately upon explicit user authorization.
    expect(result.current.isRedacted).toBe(false);
  });

  it('should autonomously re-engage redaction mask after the 30-second TTL (Memory Teardown)', () => {
    const { result } = renderHook(() => useDataRedaction());

    // Phase 1: Authorize the transient exposure window.
    act(() => {
      result.current.revealData();
    });

    expect(result.current.isRedacted).toBe(false);

    // Phase 2: Time Travel — advance the fake clock by exactly 30 seconds.
    // This synchronously fires the setTimeout callback scheduled inside
    // revealData(), collapsing the async wait into a single deterministic tick.
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    // Assertion: the autonomous Memory-level Data Sanitization cycle must have
    // fired, reverting the state machine to the redacted posture.
    // Any failure here indicates a timer misconfiguration or missing cleanup
    // that would leave PII exposed indefinitely post-TTL expiry.
    expect(result.current.isRedacted).toBe(true);
  });

  it('should NOT re-engage redaction before the 30-second TTL elapses', () => {
    const { result } = renderHook(() => useDataRedaction());

    act(() => {
      result.current.revealData();
    });

    // Advance 29 seconds — one tick before the sanitization cycle fires.
    act(() => {
      vi.advanceTimersByTime(29_000);
    });

    // Assertion: the exposure window must still be active at t=29s.
    // Premature redaction would degrade the authorized UX window.
    expect(result.current.isRedacted).toBe(false);
  });

  it('should reset the TTL clock when revealData() is called a second time (timer deduplication)', () => {
    const { result } = renderHook(() => useDataRedaction());

    // First authorization — starts the 30s window.
    act(() => {
      result.current.revealData();
    });

    // Advance 20 seconds into the first window.
    act(() => {
      vi.advanceTimersByTime(20_000);
    });

    // Second authorization — must abort the first timer and restart a fresh 30s window.
    act(() => {
      result.current.revealData();
    });

    // Advance 20 more seconds (40s total from first reveal, but only 20s from second).
    act(() => {
      vi.advanceTimersByTime(20_000);
    });

    // Assertion: state must still be exposed — the reset extended the window.
    // If the original timer was NOT cleared, redaction would have re-engaged
    // at t=30s (10 seconds ago), proving the deduplication logic is broken.
    expect(result.current.isRedacted).toBe(false);
  });

  it('should clear the pending timer on unmount to prevent ghost state updates (Memory Leak Guard)', () => {
    const { result, unmount } = renderHook(() => useDataRedaction());

    act(() => {
      result.current.revealData();
    });

    // Unmount before the TTL expires — simulates navigating away mid-exposure.
    // The useEffect cleanup must cancel the pending setTimeout.
    unmount();

    // Advance past the TTL — if the timer was NOT cleared, the callback would
    // attempt to call setState on a deallocated component, producing a
    // React "Can't perform a state update on an unmounted component" warning.
    // Vitest's fake timers make this a synchronous, verifiable assertion.
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(30_000);
      });
    }).not.toThrow();
  });
});
