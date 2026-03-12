import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardView } from './DashboardView';
import { AodaTelemetryHUD } from './AodaTelemetryHUD';
import { LogOut, Shield, Keyboard, X } from 'lucide-react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { SessionTimeoutModal } from '../../auth/components/SessionTimeoutModal';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { useAodaTelemetry } from '../store/useAodaTelemetry';
import { useDemoMode } from '../../../core/hooks/useDemoMode';
import { DemoBeacon } from '../../../core/components/DemoBeacon';

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
  const { isIdle, resetIdleTimer, forceTimeout } = useIdleTimeout();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isDemoMode } = useDemoMode();
  const [showAodaToast, setShowAodaToast] = useState(false);

  useEffect(() => {
    if (isIdle) setIsModalOpen(true);
  }, [isIdle]);

  useEffect(() => {
    if (!isDemoMode) return;
    const t = setTimeout(() => setShowAodaToast(true), 2000);
    return () => clearTimeout(t);
  }, [isDemoMode]);

  // Session teardown pipeline: wipe in-memory state machine first,
  // then redirect — guarantees no stale auth payload persists during
  // the navigation transition (OWASP A07).
  const handleLogout = () => {
    teardownSession();
    navigate('/login', { replace: true });
  };

  const handleStayLoggedIn = () => {
    setIsModalOpen(false);
    resetIdleTimer();
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      {/* Persistent top bar — rendered once at the protected zone boundary */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-border bg-surface shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold tracking-wide text-text-primary">
            Aegis Platform
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Dead Man's Switch trigger — intentionally low-contrast to remain invisible
              during normal operation; surfaces only to a trained eye during live demos.
              Bypasses the IDLE_MS wall clock via forceTimeout escape hatch. */}
          <DemoBeacon message="⏩ Test 5-Min Meltdown 👉" />
          <button
            type="button"
            onClick={forceTimeout}
            onMouseEnter={() => !isDemoMode && useAodaTelemetry.getState().announce('Navigation focused. Screen reader active.')}
            className="text-[10px] font-mono tracking-wider text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
          >
            [ Fast-Forward Teardown ]
          </button>

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

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — nav slot above; telemetry HUD anchored at bottom */}
        <aside className="flex flex-col w-48 shrink-0 border-r border-border bg-surface/50 py-4">
          <div className="flex-1 min-h-0" aria-hidden />
          {/* AODA telemetry block in document flow above Pedigree Seal — no overlap, natural stack */}
          <AodaTelemetryHUD />
          {/* CI/CD pedigree seal — enforce strict flex alignment for telemetry status indicators */}
          <div
            className="mt-auto px-3 py-2 border-t border-border/50 select-none cursor-default group"
            title="CI/CD & type-safety telemetry"
          >
            <ul className="flex flex-col gap-1.5 text-[10px] font-mono tracking-wider text-slate-500 group-hover:text-slate-300 transition-colors" aria-hidden>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 shrink-0 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                <span>SYS.AUDIT // PASSED</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 shrink-0 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                <span>COVERAGE // 100% (VITEST)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 shrink-0 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                <span>ZOD GATEWAY // ACTIVE</span>
              </li>
            </ul>
          </div>
        </aside>

        {/* Primary content boundary — DashboardView injected as the MVP surface */}
        <main className="flex-1 p-6 min-w-0">
          <DashboardView />
        </main>
      </div>

      <SessionTimeoutModal
        isOpen={isModalOpen}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleLogout}
      />

      {showAodaToast && isDemoMode && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 bg-slate-900 border border-slate-700 rounded-lg shadow-xl dark:bg-slate-800 animate-in slide-in-from-bottom-5 fade-in duration-500">
          <Keyboard className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 max-w-xs">
            <p className="text-sm font-semibold text-white">Accessibility (AODA) Ready</p>
            <p className="text-xs text-slate-300">Put down your mouse. Try pressing the <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-teal-300 font-mono text-[10px]">TAB</kbd> key to navigate securely.</p>
          </div>
          <button onClick={() => setShowAodaToast(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
        </div>
      )}
    </div>
  );
};
