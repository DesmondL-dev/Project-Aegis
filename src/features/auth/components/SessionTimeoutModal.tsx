import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Clock } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const COUNTDOWN_SECONDS = 60;

interface SessionTimeoutModalProps {
  isOpen:       boolean;
  onStayLoggedIn: () => void;
}

// SessionTimeoutModal — OWASP A07 Intercept Layer.
//
// Presented when the idle detection engine fires after the configured
// inactivity threshold. The user has COUNTDOWN_SECONDS to acknowledge
// and extend their session. If no action is taken, the state machine
// is torn down and the user is physically redirected to the login boundary.
//
// `useAuthStore.getState()` is used for the teardown dispatch (not the hook)
// to guarantee we read the latest store state at invocation time, not a
// stale closure snapshot captured at render — critical for correctness
// during race conditions between idle timeout and manual logout.
export const SessionTimeoutModal = ({ isOpen, onStayLoggedIn }: SessionTimeoutModalProps) => {
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_SECONDS);
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate                  = useNavigate();

  const clearCountdownInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset countdown state on close so the next trigger starts fresh.
      clearCountdownInterval();
      setCountdown(COUNTDOWN_SECONDS);
      return;
    }

    // Hydrate the countdown state machine on open.
    setCountdown(COUNTDOWN_SECONDS);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearCountdownInterval();

          // OWASP A07 — Forced session termination.
          // getState() bypasses React's render cycle to guarantee the
          // teardown action executes against the live store, not a
          // stale closure. This is the safest pattern for imperative
          // out-of-band state mutations triggered by timer callbacks.
          useAuthStore.getState().teardownSession();
          navigate('/login', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1_000);

    // Unmount / close cleanup — prevents the interval from continuing to
    // decrement state after the modal is dismissed or the component is torn down.
    return () => {
      clearCountdownInterval();
    };
  }, [isOpen, navigate]);

  if (!isOpen) return null;

  // Compute the visual progress arc for the countdown ring.
  const RADIUS          = 28;
  const CIRCUMFERENCE   = 2 * Math.PI * RADIUS;
  const progress        = countdown / COUNTDOWN_SECONDS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const isUrgent         = countdown <= 15;

  return (
    // Full-screen intercept overlay — z-[9999] ensures it renders above all
    // application surfaces including the AuditDrawer (z-50).
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-desc"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <div className="p-2 rounded-xl bg-amber-500/10">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2
              id="session-timeout-title"
              className="text-sm font-semibold text-text-primary"
            >
              Session Expiring
            </h2>
            <p className="text-xs text-text-muted">Your clearance session is about to terminate.</p>
          </div>
        </div>

        {/* Countdown ring */}
        <div className="flex flex-col items-center gap-3 px-6 py-4">
          <div className="relative flex items-center justify-center">
            <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
              {/* Track ring */}
              <circle
                cx="36" cy="36" r={RADIUS}
                fill="none"
                strokeWidth="4"
                className="stroke-border"
              />
              {/* Progress ring */}
              <circle
                cx="36" cy="36" r={RADIUS}
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                className={`transition-all duration-1000 ${isUrgent ? 'stroke-red-500' : 'stroke-amber-500'}`}
              />
            </svg>
            <div className="absolute flex items-center gap-1">
              <Clock className={`w-3 h-3 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
              <span className={`text-lg font-bold tabular-nums ${isUrgent ? 'text-red-500' : 'text-text-primary'}`}>
                {countdown}
              </span>
            </div>
          </div>

          <p
            id="session-timeout-desc"
            className="text-xs text-center text-text-muted"
          >
            You will be automatically logged out in{' '}
            <span className={`font-semibold ${isUrgent ? 'text-red-500' : 'text-text-primary'}`}>
              {countdown} second{countdown !== 1 ? 's' : ''}
            </span>{' '}
            due to inactivity.
          </p>
        </div>

        {/* Action bar */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            onClick={() => {
              useAuthStore.getState().teardownSession();
              navigate('/login', { replace: true });
            }}
            className="flex-1 py-2 text-sm font-medium rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            Log Out Now
          </button>
          <button
            onClick={onStayLoggedIn}
            autoFocus
            className="flex-1 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
};
