import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useIdleTimeout } from '../../auth/hooks/useIdleTimeout';
import { SessionTimeoutModal } from '../../auth/components/SessionTimeoutModal';
import { DashboardView } from './DashboardView';

// Protected zone shell — rendered exclusively after the ProtectedRoute
// perimeter has validated the authentication predicate.
// Owns the idle session detection engine and the A07 warning intercept modal.
export const DashboardLayout = () => {
  // Atomic selectors — see selector discipline note in useAuthStore.ts.
  const user            = useAuthStore((state) => state.user);
  const teardownSession = useAuthStore((state) => state.teardownSession);
  const navigate        = useNavigate();

  // Controls visibility of the SessionTimeoutModal intercept layer.
  // Hoisted to this boundary so the modal can access the layout's idle reset API.
  const [isTimeoutWarningVisible, setIsTimeoutWarningVisible] = useState<boolean>(false);

  // onIdle fires when the idle threshold is breached — engage the A07 intercept.
  const handleIdle = useCallback(() => {
    setIsTimeoutWarningVisible(true);
  }, []);

  const { resetTimer } = useIdleTimeout({
    idleTimeMs: 5 * 60 * 1_000, // 5-minute idle threshold
    onIdle:     handleIdle,
  });

  // "Stay Logged In" pipeline: dismiss the modal and reset the idle clock.
  // Calling resetTimer here re-arms the detection engine without requiring
  // a re-mount of the hook.
  const handleStayLoggedIn = useCallback(() => {
    setIsTimeoutWarningVisible(false);
    resetTimer();
  }, [resetTimer]);

  // Manual logout: wipe in-memory state machine first, then redirect.
  // Guarantees no stale auth payload persists during the navigation transition
  // (OWASP A07 — Session Hijacking mitigation).
  const handleLogout = useCallback(() => {
    teardownSession();
    navigate('/login', { replace: true });
  }, [teardownSession, navigate]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Persistent top bar — rendered once at the protected zone boundary */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-border bg-surface shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold tracking-wide text-text-primary">
            Aegis Platform
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* User identity payload display */}
          {user && (
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-text-primary">{user.email}</p>
              <p className="text-xs text-text-muted">{user.role.replace('_', ' ')}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-text-primary hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Primary content boundary */}
      <main className="p-6">
        <DashboardView />
      </main>

      {/* A07 Session Timeout Intercept — mounted at the layout root to guarantee
          it overlays the entire protected zone surface, including the AuditDrawer. */}
      <SessionTimeoutModal
        isOpen={isTimeoutWarningVisible}
        onStayLoggedIn={handleStayLoggedIn}
      />
    </div>
  );
};
