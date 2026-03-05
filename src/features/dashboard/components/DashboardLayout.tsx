import { useNavigate } from 'react-router-dom';
import { DashboardView } from './DashboardView';
import { LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../../auth/store/useAuthStore';

// Protected zone shell — rendered exclusively after the ProtectedRoute
// perimeter has validated the authentication predicate.
// Provides the persistent chrome (top bar) and Outlet slot for nested routes.
export const DashboardLayout = () => {
  // Selectors are intentionally split into discrete primitive subscriptions.
  // An inline object selector `(state) => ({ a, b })` constructs a new reference
  // on every invocation — Zustand's useSyncExternalStore getSnapshot would detect
  // a perpetually unstable snapshot and trigger an infinite re-render cycle.
  // Atomic selectors return stable primitives/references, eliminating the thrash.
  const user             = useAuthStore((state) => state.user);
  const teardownSession  = useAuthStore((state) => state.teardownSession);
  const navigate = useNavigate();

  // Session teardown pipeline: wipe in-memory state machine first,
  // then redirect — guarantees no stale auth payload persists during
  // the navigation transition (OWASP A07).
  const handleLogout = () => {
    teardownSession();
    navigate('/login', { replace: true });
  };

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

      {/* Primary content boundary — DashboardView injected as the MVP surface */}
      <main className="p-6">
        <DashboardView />
      </main>
    </div>
  );
};
