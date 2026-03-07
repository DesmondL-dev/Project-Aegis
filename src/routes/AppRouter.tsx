import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Code-splitting: route-level chunks are loaded on demand. Lazy evaluation
// defers module parsing and execution until the segment is matched.
const LoginForm = lazy(() =>
  import('../features/auth/components/LoginForm').then((m) => ({ default: m.LoginForm }))
);
const ProtectedRoute = lazy(() =>
  import('../features/auth/components/ProtectedRoute').then((m) => ({ default: m.ProtectedRoute }))
);
const DashboardLayout = lazy(() =>
  import('../features/dashboard/components/DashboardLayout').then((m) => ({ default: m.DashboardLayout }))
);

/** Suspense fallback: minimal terminal-style placeholder while chunk loads. */
const ChunkFallback = () => (
  <div
    className="flex min-h-screen items-center justify-center bg-background font-mono text-sm text-cyan-400"
    role="status"
    aria-label="Loading"
  >
    <span>INITIALIZING SYSTEM...</span>
    <span
      className="ml-1 inline-block h-4 w-3 animate-pulse bg-cyan-400 shadow-lg shadow-cyan-500/50"
      aria-hidden
    />
  </div>
);

// Canonical route manifest — single source of truth for the application's
// navigation graph. All protected branches are enclosed within the
// ProtectedRoute perimeter to enforce the authentication predicate at
// the routing layer before any component tree is mounted.
export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<ChunkFallback />}>
        <Routes>
          {/* Public surface — accessible prior to authentication handshake */}
          <Route path="/login" element={<LoginForm />} />

          {/* Protected zone — ProtectedRoute acts as the RBAC entry checkpoint.
              All child routes implicitly inherit the authentication predicate. */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route
                path="/"
                element={
                  // Placeholder index — replaced with feature routes in subsequent sprints
                  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                    <p className="text-lg font-semibold text-text-primary">Dashboard</p>
                    <p className="text-sm text-text-muted">Protected zone active. Awaiting feature injection.</p>
                  </div>
                }
              />
            </Route>
          </Route>

          {/* Catch-all: redirect any unresolved path to the public login boundary */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
